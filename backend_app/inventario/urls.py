from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token # <--- IMPORTA ESTO

from .views import (
    RegistroAlumnoView, 
    MenuView, 
    CrearPedidoView, 
    HistorialPedidosAlumnoView,
    GestionPedidosCocinaView,
    ActualizarEstadoPedidoView,
    AlertasStockCriticoView,
    RegistrarLoteAlmacenView, 
    CierreCajaDiarioView,
    CrearProductoView,
    ListaCategoriasView,
)

urlpatterns = [
    # Alumnos
    path('auth/registro/', RegistroAlumnoView.as_view(), name='registro-alumno'),
    path('auth/login/', obtain_auth_token, name='login-api'), # <--- AGREGA ESTA LÍNEA EXACTA
    
    path('menu/', MenuView.as_view(), name='menu-publico'),
    path('pedidos/crear/', CrearPedidoView.as_view(), name='crear-pedido'),
    path('pedidos/historial/', HistorialPedidosAlumnoView.as_view(), name='historial-pedidos'),
    
    # Cocina
    path('cocina/pedidos/', GestionPedidosCocinaView.as_view(), name='cocina-lista-pedidos'),
    path('cocina/pedidos/<int:pedido_id>/estado/', ActualizarEstadoPedidoView.as_view(), name='cocina-cambiar-estado'),
    path('cocina/alertas-stock/', AlertasStockCriticoView.as_view(), name='cocina-alertas-stock'),
    path('cocina/registrar-lote/', RegistrarLoteAlmacenView.as_view(), name='cocina-registrar-lote'),
    path('cocina/productos/crear/', CrearProductoView.as_view(), name='cocina-crear-producto'),
    path('cocina/categorias/', ListaCategoriasView.as_view(), name='cocina-lista-categorias'),
    path('cocina/cierre-caja/', CierreCajaDiarioView.as_view(), name='cocina-cierre-caja'),
]
