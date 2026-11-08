from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from .models import Pedido, LoteAlmacen

@receiver(post_save, sender=Pedido)
def descontar_stock_peps_al_entregar_pedido(sender, instance, created, **kwargs):
    """
    Se ejecuta cada vez que se guarda un Pedido.
    Si el estado cambia o se guarda en 'ENTREGADO', recorre todas sus líneas 
    asociadas de DetallePedido y descuenta del inventario usando la regla PEPS.
    """
    # Solo actuamos si el pedido pasa al estado definitivo 'ENTREGADO'
    # y SOLO si todavía no se había descontado (evita el doble descuento
    # cuando CambiarEstadoPedidoSerializer.update() ya hizo el descuento
    # y luego llama a pedido.save(), lo cual vuelve a disparar esta señal).
    if instance.estado == 'ENTREGADO' and not instance.descontado_inventario:
        
        with transaction.atomic():
            # Traemos todos los detalles que pertenecen a este pedido de golpe
            detalles = instance.detalles.select_related('producto').all()
            hoy = timezone.localdate()
            
            for detalle in detalles:
                producto = detalle.producto
                cantidad_a_descontar = detalle.cantidad
                
                # Si es un producto preparado en la cafetería de CONALEP, no afecta lotes físicos
                if producto.es_preparado:
                    continue  
                
                # 1. Traemos los lotes con stock activo vigentes (no caducados) ordenados por PEPS
                lotes = LoteAlmacen.objects.filter(
                    producto=producto,
                    cantidad__gt=0,
                    fecha_caducidad__gte=hoy
                ).order_by('fecha_caducidad', 'fecha_ingreso')
                
                # 2. Validación de seguridad en base de datos
                total_en_almacen = lotes.aggregate(total=Sum('cantidad'))['total'] or 0
                if total_en_almacen < cantidad_a_descontar:
                    raise ValueError(
                        f"¡Stock insuficiente en lotes vigentes para '{producto.nombre}'! "
                        f"Requerido: {cantidad_a_descontar}, Disponible: {total_en_almacen}."
                    )
                
                # 3. Aplicación estricta de la regla PEPS
                for lote in lotes:
                    if cantidad_a_descontar <= 0:
                        break
                        
                    if lote.cantidad >= cantidad_a_descontar:
                        lote.cantidad -= cantidad_a_descontar
                        cantidad_a_descontar = 0
                    else:
                        cantidad_a_descontar -= lote.cantidad
                        lote.cantidad = 0
                    lote.save()
                
                # 4. Monitoreo Post-Descuento: Verificación de Alerta de Stock Mínimo
                stock_restante = LoteAlmacen.objects.filter(
                    producto=producto,
                    fecha_caducidad__gte=hoy
                ).aggregate(total=Sum('cantidad'))['total'] or 0
                
                if stock_restante <= producto.stock_minimo_alerta:
                    print(f"\n⚠️  [ALERTA INVENTARIO CRÍTICO - CONALEP]")
                    print(f"El producto '{producto.nombre}' ha alcanzado o bajado de su límite mínimo.")
                    print(f"Configurado: {producto.stock_minimo_alerta} unidades | Disponible Real: {stock_restante} unidades.\n")

            # Marcamos el pedido como ya descontado usando .update() (no .save())
            # para NO volver a disparar este mismo signal (evitaríamos un loop
            # infinito) y para que cualquier guardado futuro de este pedido
            # (desde el admin, el serializer, etc.) ya no vuelva a descontar.
            Pedido.objects.filter(pk=instance.pk).update(descontado_inventario=True)
