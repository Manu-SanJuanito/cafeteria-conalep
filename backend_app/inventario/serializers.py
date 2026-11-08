from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from django.db import transaction

# Importamos directamente los modelos desde su módulo absoluto para evitar la importación circular:
from inventario.models import Categoria, Producto, Alumno, Pedido, DetallePedido

class RegistroAlumnoSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    matricula = serializers.CharField(required=True, max_length=20)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'matricula']

    def validate_email(self, value):
        email_limpio = value.strip().lower()
        dominio_oficial = "@hgo.conalep.edu.mx"
        if not email_limpio.endswith(dominio_oficial):
            raise serializers.ValidationError(
                f"Acceso denegado. Es obligatorio registrarse con el correo institucional ({dominio_oficial})."
            )
        if User.objects.filter(email=email_limpio).exists():
            raise serializers.ValidationError("Este correo institucional ya está registrado.")
        return email_limpio

    def validate_matricula(self, value):
        matricula_limpia = value.strip()
        if Alumno.objects.filter(matricula=matricula_limpia).exists():
            raise serializers.ValidationError("Esta matrícula ya se encuentra registrada.")
        return matricula_limpia

    def create(self, validated_data):
        matricula = validated_data.pop('matricula')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        
        Alumno.objects.create(usuario=user, matricula=matricula)
        return user

class ProductoMenuSerializer(serializers.ModelSerializer):
    stock_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'es_preparado', 'stock_disponible']

    def get_stock_disponible(self, obj):
        if obj.es_preparado:
            return 999  

        hoy = timezone.localdate()
        
        # 1. Obtener el stock físico en lotes vigentes
        total_stock = obj.lotes.filter(
            fecha_caducidad__gte=hoy,
            cantidad__gt=0
        ).aggregate(total_suma=models.Sum('cantidad'))['total_suma'] or 0

        # 2. FIX 1: APARTADO VIRTUAL con LISTO incluido
        # Si no pones LISTO, al pasar a LISTO se libera y otros piden lo mismo
        cantidad_apartada = obj.detallepedido_set.filter(
            pedido__estado__in=['PENDIENTE', 'PREPARANDO', 'LISTO']
        ).aggregate(total_suma=models.Sum('cantidad'))['total_suma'] or 0

        # 3. Stock neto disponible
        stock_neto = total_stock - cantidad_apartada
        return max(0, stock_neto)

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']


class ProductoCrearSerializer(serializers.ModelSerializer):
    # En vez de pedir el ID de una categoría ya existente, dejamos que el personal
    # escriba el nombre: si ya existe la reusamos, si no, la creamos al vuelo.
    # Así "Paletas" puede darse de alta sin tener que entrar antes al admin de Django.
    categoria_nombre = serializers.CharField(write_only=True, max_length=100)
    categoria = CategoriaSerializer(read_only=True)

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'categoria', 'categoria_nombre', 'es_preparado', 'stock_minimo_alerta']

    def validate_nombre(self, value):
        nombre_limpio = value.strip()
        if not nombre_limpio:
            raise serializers.ValidationError("El nombre del producto no puede estar vacío.")
        if Producto.objects.filter(nombre__iexact=nombre_limpio).exists():
            raise serializers.ValidationError(f"Ya existe un producto llamado '{nombre_limpio}'.")
        return nombre_limpio

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a cero.")
        return value

    def create(self, validated_data):
        nombre_categoria = validated_data.pop('categoria_nombre').strip()
        categoria = Categoria.objects.filter(nombre__iexact=nombre_categoria).first()
        if categoria is None:
            categoria = Categoria.objects.create(nombre=nombre_categoria)
        return Producto.objects.create(categoria=categoria, **validated_data)


class MenuCategoriaSerializer(serializers.ModelSerializer):
    productos = ProductoMenuSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'productos']

class DetallePedidoSerializer(serializers.ModelSerializer):
    precio_unitario = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = DetallePedido
        fields = ['producto', 'producto_nombre', 'cantidad', 'precio_unitario']

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, allow_empty=False)
    total = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    alumno = serializers.PrimaryKeyRelatedField(read_only=True)
    alumno_nombre = serializers.SerializerMethodField()
    matricula = serializers.CharField(source='alumno.matricula', read_only=True)

    class Meta:
        model = Pedido
        fields = ['id', 'alumno', 'alumno_nombre', 'matricula', 'fecha', 'metodo_pago', 'estado', 'total', 'detalles']
        read_only_fields = ['estado', 'fecha']

    def get_alumno_nombre(self, obj):
        usuario = obj.alumno.usuario
        return f"{usuario.first_name} {usuario.last_name}".strip()

    def validate_detalles(self, value):
        for item in value:
            if item['cantidad'] <= 0:
                raise serializers.ValidationError("La cantidad de cada producto debe ser mayor a cero.")
        return value

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        request = self.context.get('request')
        
        try:
            alumno = request.user.alumno_perfil
        except AttributeError:
            raise serializers.ValidationError({"error": "El usuario autenticado no cuenta con un perfil de Alumno válido."})

        with transaction.atomic():
            pedido = Pedido.objects.create(alumno=alumno, total=0, **validated_data)
            total_pedido = 0
            hoy = timezone.localdate()
            
            for detalle in detalles_data:
                producto = detalle['producto']
                cantidad_solicitada = detalle['cantidad']
                
                if not producto.es_preparado:
                    # 1. Calcular stock físico total
                    total_stock = producto.lotes.filter(
                        fecha_caducidad__gte=hoy,
                        cantidad__gt=0
                    ).aggregate(total_suma=models.Sum('cantidad'))['total_suma'] or 0
                    
                    # 2. FIX 1: APARTADO VIRTUAL con LISTO incluido
                    cantidad_apartada = producto.detallepedido_set.filter(
                        pedido__estado__in=['PENDIENTE', 'PREPARANDO', 'LISTO']
                    ).aggregate(total_suma=models.Sum('cantidad'))['total_suma'] or 0
                    
                    disponible_real = total_stock - cantidad_apartada
                    
                    # 3. Candado de seguridad
                    if disponible_real < cantidad_solicitada:
                        raise serializers.ValidationError({
                            "stock": f"¡Huy bro! Alguien te ganó el mandado. Stock disponible real para '{producto.nombre}': {max(0, disponible_real)} unidades."
                        })
                
                precio_fijo = producto.precio
                total_pedido += (precio_fijo * cantidad_solicitada)
                
                DetallePedido.objects.create(
                    pedido=pedido,
                    producto=producto,
                    cantidad=cantidad_solicitada,
                    precio_unitario=precio_fijo
                )
            
            pedido.total = total_pedido
            pedido.save()
            
        return pedido   

class CambiarEstadoPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = ['id', 'alumno', 'fecha', 'metodo_pago', 'estado', 'total', 'pago_confirmado']
        read_only_fields = ['id', 'alumno', 'fecha', 'metodo_pago', 'total']

    def validate(self, attrs):
        # Obtenemos el estado actual de la base de datos y el nuevo que viene del frontend
        instance = self.instance
        if instance is None:
            return attrs
        nuevo_estado = attrs.get('estado', instance.estado)
        pago_confirmado = attrs.get('pago_confirmado', instance.pago_confirmado)

        # CANDADO FINANCIERO: Bloquear entrega si es efectivo y no han pagado en físico
        if nuevo_estado == 'ENTREGADO' and instance.metodo_pago == 'EFECTIVO' and not pago_confirmado:
            raise serializers.ValidationError({
                "pago_confirmado": "¡Alto ahí, Halcón! No se puede entregar el pedido si el alumno no ha pagado en efectivo en la caja."
            })
        return attrs

    def update(self, instance, validated_data):
        nuevo_estado = validated_data.get('estado', instance.estado)

        with transaction.atomic():
            # Volvemos a bloquear por si la vista no lo hizo
            pedido = Pedido.objects.select_for_update().get(pk=instance.pk)
            estado_anterior = pedido.estado
            ya_descontado = pedido.descontado_inventario

            pedido.pago_confirmado = validated_data.get('pago_confirmado', pedido.pago_confirmado)
            pedido.estado = nuevo_estado

            # ✅ SOLO descuenta si es ENTREGADO, NO estaba entregado Y NO se había descontado antes
            # Aunque te lleguen 5 PUTs de ENTREGADO como en tu log, solo el primero descuenta
            if nuevo_estado == 'ENTREGADO' and estado_anterior != 'ENTREGADO' and not ya_descontado:
                print(f"💸 DESCONTANDO pedido {pedido.id} - es la primera vez")
                for detalle in pedido.detalles.all():
                    producto = detalle.producto
                    if producto.es_preparado:
                        continue
                    cantidad_a_descontar = detalle.cantidad
                    lotes = producto.lotes.filter(
                        fecha_caducidad__gte=timezone.localdate(),
                        cantidad__gt=0
                    ).order_by('fecha_caducidad', 'id')
                    for lote in lotes:
                        if cantidad_a_descontar <= 0:
                            break
                        if lote.cantidad >= cantidad_a_descontar:
                            lote.cantidad -= cantidad_a_descontar
                            lote.save()
                            cantidad_a_descontar = 0
                        else:
                            cantidad_a_descontar -= lote.cantidad
                            lote.cantidad = 0
                            lote.save()
                    if cantidad_a_descontar > 0:
                        raise serializers.ValidationError({
                            "error": f"Inconsistencia crítica de inventario para '{producto.nombre}'."
                        })
                pedido.descontado_inventario = True
            else:
                if nuevo_estado == 'ENTREGADO':
                    print(f"🛑 NO DESCUENTO pedido {pedido.id} - ya estaba descontado o ya estaba entregado")

            pedido.save()
            return pedido