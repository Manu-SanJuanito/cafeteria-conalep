import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from inventario.models import LoteAlmacen


class Command(BaseCommand):  # <── Revisa que esté escrito exactamente así, con "C" mayúscula
    help = "Revisa los lotes en almacén y detecta productos caducados o próximos a vencer en los siguientes 5 días."

    def handle(self, *args, **options):
        hoy = timezone.localdate()
        limite_proximos = hoy + datetime.timedelta(days=5)

        self.stdout.write(self.style.MIGRATE_HEADING(f"--- REVISIÓN DE CADUCIDAD DE LOTES ({hoy}) ---"))

        # Consulta lotes Caducados
        lotes_caducados = LoteAlmacen.objects.filter(
            fecha_caducidad__lt=hoy,
            cantidad__gt=0
        ).select_related('producto')

        # Consulta lotes Próximos a Vencer
        lotes_proximos = LoteAlmacen.objects.filter(
            fecha_caducidad__gte=hoy,
            fecha_caducidad__lte=limite_proximos,
            cantidad__gt=0
        ).select_related('producto')

        # Salida de Caducados
        self.stdout.write(self.style.ERROR("\n[⚠️] LOTES CADUCADOS (¡Retirar de inmediato!)"))
        if not lotes_caducados.exists():
            self.stdout.write("No se encontraron lotes caducados con existencias disponibles.")
        else:
            for lote in lotes_caducados:
                self.stdout.write(
                    f"- Producto: {lote.producto.nombre} | Cantidad: {lote.cantidad} | "
                    f"Caducó el: {lote.fecha_caducidad}"
                )

        # Salida de Próximos a Vencer
        self.stdout.write(self.style.WARNING("\n[⏳] LOTES PRÓXIMOS A VENCER (Siguientes 5 días)"))
        if not lotes_proximos.exists():
            self.stdout.write("No hay lotes próximos a vencer con existencias disponibles.")
        else:
            for lote in lotes_proximos:
                dias_restantes = (lote.fecha_caducidad - hoy).days
                self.stdout.write(
                    f"- Producto: {lote.producto.nombre} | Cantidad: {lote.cantidad} | "
                    f"Vence el: {lote.fecha_caducidad} ({dias_restantes} días restantes)"
                )

        self.stdout.write(self.style.SUCCESS("\n--- REVISIÓN FINALIZADA CON ÉXITO ---"))
