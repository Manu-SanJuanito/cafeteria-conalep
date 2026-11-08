from django.utils.timezone import localdate
from rest_framework.authentication import TokenAuthentication
from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .models import Categoria, Pedido, Producto,LoteAlmacen
from django.db.models import Sum
from decimal import Decimal
from django.db import transaction
from .serializers import (
    RegistroAlumnoSerializer, 
    MenuCategoriaSerializer, 
    PedidoSerializer, 
    CambiarEstadoPedidoSerializer,
    ProductoMenuSerializer,
    ProductoCrearSerializer,
    CategoriaSerializer,
)

class RegistroAlumnoView(APIView):
   
    def post(self, request):
        serializer = RegistroAlumnoSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"mensaje": "Alumno registrado con éxito. ¡Ya puedes iniciar sesión!"}, 
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MenuView(APIView):
  
    permission_classes = [AllowAny]  # Permite que los alumnos vean la comida sin estar logueados todavía

    def get(self, request, *args, **kwargs):
        # Buscamos todas las categorías y traemos de golpe sus productos (optimizado)
        categorias = Categoria.objects.prefetch_related('productos').all()
        serializer = MenuCategoriaSerializer(categorias, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class CrearPedidoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Toda la lógica de apartado + candado ya está en PedidoSerializer.create
        # Aquí NO filtres por producto, porque Pedido no tiene ese campo
        serializer = PedidoSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"mensaje": "Pedido registrado correctamente en la cocina.", "pedido": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HistorialPedidosAlumnoView(APIView):

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            alumno = request.user.alumno_perfil
            pedidos = Pedido.objects.filter(alumno=alumno).order_by('-fecha')
            serializer = PedidoSerializer(pedidos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response({"error": "Perfil de alumno no encontrado."}, status=status.HTTP_404_NOT_FOUND)


class GestionPedidosCocinaView(APIView):
   
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        # La cocina ve todos los pedidos, ordenados para mostrar primero los más recientes
        pedidos = Pedido.objects.all().order_by('-fecha')
        serializer = PedidoSerializer(pedidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActualizarEstadoPedidoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def put(self, request, pedido_id):
        try:
            # ✅ FIX: Bloqueamos el pedido desde la vista, nadie más lo puede leer hasta que terminemos
            # Esto mata el doble PUT pegado de tu log
            with transaction.atomic():
                pedido = Pedido.objects.select_for_update().get(id=pedido_id)
                estado_anterior = pedido.estado

                print(f"🔥 PUT pedido {pedido_id}: {estado_anterior} -> {request.data.get('estado')} | pago={request.data.get('pago_confirmado')} | ya_descontado={pedido.descontado_inventario}")

                serializer = CambiarEstadoPedidoSerializer(pedido, data=request.data, partial=True)
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                serializer.save()
                pedido.refresh_from_db()

                print(f"✅ PUT pedido {pedido_id} terminado: ahora {pedido.estado} | descontado={pedido.descontado_inventario}")

                mensajes = {
                    'PREPARANDO': f"¡Pedido #{pedido.id} ahora está en preparación en la cocina!",
                    'LISTO': f"¡Pedido #{pedido.id} está listo! Se notificará al alumno.",
                    'ENTREGADO': f"¡Pedido #{pedido.id} entregado con éxito! Se aplicó descuento de inventario PEPS."
                }
                msg = mensajes.get(pedido.estado, f"Pedido #{pedido.id} actualizado a {pedido.estado}.")

                return Response({
                    "mensaje": msg,
                    "pedido_id": pedido.id,
                    "estado_anterior": estado_anterior,
                    "nuevo_estado": pedido.estado,
                    "pago_confirmado": pedido.pago_confirmado,
                    "pedido": CambiarEstadoPedidoSerializer(pedido).data
                }, status=status.HTTP_200_OK)
        except Pedido.DoesNotExist:
            return Response({"error": "El pedido solicitado no existe."}, status=status.HTTP_404_NOT_FOUND)


class AlertasStockCriticoView(APIView):
   
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Al usar localdate directamente, Python ya no se confunde con ninguna otra librería
        hoy = localdate()
        productos = Producto.objects.filter(es_preparado=False)
        productos_en_alerta = []
        
        for producto in productos:
            if producto.stock_actual <= producto.stock_minimo_alerta:
                serializer = ProductoMenuSerializer(producto)
                datos_producto = serializer.data
                datos_producto['stock_minimo_alerta'] = producto.stock_minimo_alerta
                productos_en_alerta.append(datos_producto)
                
        return Response({
            "conteo_alertas": len(productos_en_alerta),
            "productos_criticos": productos_en_alerta
        }, status=status.HTTP_200_OK)

# Asegúrate de importar Sum al inicio de tu archivo views.py si no lo tienes:
# 

# =====================================================================
# 🆕 ALTA DE PRODUCTOS NUEVOS (no requiere entrar al admin de Django)
# =====================================================================
class CrearProductoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = ProductoCrearSerializer(data=request.data)
        if serializer.is_valid():
            producto = serializer.save()
            return Response(
                {
                    "mensaje": f"¡'{producto.nombre}' se agregó al catálogo con éxito!",
                    "producto": ProductoCrearSerializer(producto).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListaCategoriasView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        categorias = Categoria.objects.all().order_by('nombre')
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =====================================================================
# 📦 REGISTRO DE LOTES DE ALMACÉN (PEPS)
# =====================================================================
class RegistrarLoteAlmacenView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        producto_id = request.data.get('producto_id')
        cantidad = request.data.get('cantidad')
        fecha_caducidad_str = request.data.get('fecha_caducidad')

        if not all([producto_id, cantidad, fecha_caducidad_str]):
            return Response({"error": "Todos los campos (producto, cantidad, fecha_caducidad) son obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            producto = Producto.objects.get(id=producto_id)
            if producto.es_preparado:
                return Response({"error": "Los productos preparados no manejan lotes físicos en almacén."}, status=status.HTTP_400_BAD_REQUEST)
            
            if int(cantidad) <= 0:
                return Response({"error": "La cantidad ingresada debe ser mayor a cero."}, status=status.HTTP_400_BAD_REQUEST)

            # Creamos el lote en la base de datos real
            nuevo_lote = LoteAlmacen.objects.create(
                producto=producto,
                cantidad=int(cantidad),
                fecha_caducidad=fecha_caducidad_str
            )

            return Response({
                "mensaje": f"¡Lote registrado con éxito! Se añadieron {cantidad} unidades a '{producto.nombre}'.",
                "lote_id": nuevo_lote.id
            }, status=status.HTTP_201_CREATED)

        except Producto.DoesNotExist:
            return Response({"error": "El producto seleccionado no existe."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# 💵 AUDITORÍA FINANCIERA: CIERRE DE CAJA DIARIO
# =====================================================================

class CierreCajaDiarioView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        hoy = localdate()
        
        pedidos_hoy = Pedido.objects.filter(fecha__date=hoy, pago_confirmado=True)
        
        # FIX: Todo en Decimal, no en float. Si no hay ventas, Decimal('0.00')
        efectivo_real = pedidos_hoy.filter(metodo_pago='EFECTIVO').aggregate(total_suma=Sum('total'))['total_suma'] or Decimal('0.00')
        
        linea_real = pedidos_hoy.filter(metodo_pago='LINEA').aggregate(total_suma=Sum('total'))['total_suma'] or Decimal('0.00')
        
        conteo_transacciones = pedidos_hoy.count()

        total_ingresos = efectivo_real + linea_real

        return Response({
            "fecha": hoy,
            "conteo_transacciones": conteo_transacciones,
            "auditoria": {
                "efectivo_en_caja_fisica": float(efectivo_real),
                "pagos_en_linea_banco": float(linea_real),
                "total_ingresos_del_dia": float(total_ingresos)
            }
        }, status=status.HTTP_200_OK)