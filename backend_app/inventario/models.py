from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=6, decimal_places=2)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    es_preparado = models.BooleanField(default=False) 
    stock_minimo_alerta = models.IntegerField(default=5)  

    def __str__(self):
        return self.nombre

    @property
    def stock_actual(self):
        # Si es un producto preparado, no tiene límite físico de almacén
        if self.es_preparado:
            return 999
        
        # Primero obtenemos el diccionario resultante del aggregate de Django
        hoy = timezone.localdate()
        resultado = self.lotes.filter(
            fecha_caducidad__gte=hoy,
            cantidad__gt=0
        ).aggregate(total_suma=models.Sum('cantidad'))
        
        # Validamos de manera segura: si total_suma es None o no existe, devolvemos 0
        if resultado and resultado.get('total_suma') is not None:
            return resultado['total_suma']
        
        return 0


class LoteAlmacen(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='lotes')
    cantidad = models.IntegerField()
    fecha_ingreso = models.DateField(default=timezone.now)
    fecha_caducidad = models.DateField()

    def __str__(self):
        return f"Lote de {self.producto.nombre} - Caduca: {self.fecha_caducidad}"

class Alumno(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='alumno_perfil')
    matricula = models.CharField(max_length=20, unique=True)
    
    def __str__(self):
        return f"{self.usuario.first_name} {self.usuario.last_name} ({self.matricula})"

class Pedido(models.Model):
    METODOS_PAGO = [
        ('EFECTIVO', 'Pago Físico / Efectivo'),
        ('LINEA', 'Pago en Línea'),
    ]
    ESTADOS_PEDIDO = [
        ('PENDIENTE', 'Pendiente'),
        ('PREPARANDO', 'En Preparación'),
        ('LISTO', 'Listo para Entrega'),
        ('ENTREGADO', 'Entregado'),
    ]

    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='pedidos')
    fecha = models.DateTimeField(default=timezone.now)
    metodo_pago = models.CharField(max_length=10, choices=METODOS_PAGO, default='EFECTIVO')
    estado = models.CharField(max_length=15, choices=ESTADOS_PEDIDO, default='PENDIENTE')
    total = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    descontado_inventario = models.BooleanField(default=False)
    pago_confirmado = models.BooleanField(default=False)

    def __str__(self):
        return f"Pedido #{self.id} - {self.alumno.usuario.first_name} ({self.estado}) - Pagado: {self.pago_confirmado}"

class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre} en Pedido #{self.pedido.id}"

