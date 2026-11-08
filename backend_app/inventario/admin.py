from django.contrib import admin
from .models import Categoria, Producto, LoteAlmacen
from .models import Alumno, Pedido, DetallePedido

admin.site.register(Categoria)
admin.site.register(Producto)
admin.site.register(LoteAlmacen)
admin.site.register(Alumno)
admin.site.register(Pedido)
admin.site.register(DetallePedido)
