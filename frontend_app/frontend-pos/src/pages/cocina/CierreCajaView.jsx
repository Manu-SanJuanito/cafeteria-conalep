import React, { useState, useEffect } from 'react';
import cocinaService from '../../services/cocinaService';

export default function CierreCajaView() {
  const [datosCaja, setDatosCaja] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarCierre = async () => {
    try {
      setCargando(true);
      const data = await cocinaService.obtenerCierreCaja();
      setDatosCaja(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el reporte de auditoría del cierre de caja.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCierre();
  }, []);

  if (cargando) return <div style={{ padding: '40px', textSide: 'center', fontSize: '18px', fontWeight: '600', color: '#4b5563', fontFamily: 'sans-serif' }}>Calculando arqueo y balances de caja física...</div>;
  if (error) return <div style={{ padding: '40px', textSide: 'center', color: '#dc2626', fontWeight: '600', fontFamily: 'sans-serif' }}>{error}</div>;

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.ticket}>
        <div style={estilos.cabecera}>
          <h1 style={estilos.titulo}>CORTE DE CAJA</h1>
          <p style={estilos.subtitulo}>POS Cafetería Conalep</p>
          <p style={estilos.fecha}>Balance del día: {datosCaja?.fecha}</p>
        </div>

        <div style={estilos.bloqueOperaciones}>
          <p style={estilos.labelOperaciones}>Órdenes cobradas con éxito</p>
          <p style={estilos.conteo}>{datosCaja?.conteo_transacciones} Ventas</p>
        </div>

        <div style={estilos.desglose}>
          <div style={estilos.fila}>
            <span>EFECTIVO EN CAJA FÍSICA:</span>
            <strong>${datosCaja?.auditoria?.efectivo_en_caja_fisica?.toFixed(2)}</strong>
          </div>
          <div style={estilos.fila}>
            <span>PAGOS REGISTRADOS EN LÍNEA:</span>
            <strong>${datosCaja?.auditoria?.pagos_en_linea_banco?.toFixed(2)}</strong>
          </div>
        </div>

        <div style={estilos.totalContenedor}>
          <div>
            <p style={estilos.totalLabel}>VENTA TOTAL NETA</p>
            <p style={estilos.totalSub}>(Caja + Banco)</p>
          </div>
          <span style={estilos.totalMonto}>${datosCaja?.auditoria?.total_ingresos_del_dia?.toFixed(2)}</span>
        </div>

        <button onClick={cargarCierre} style={estilos.botonRefrescar}>
          Recalcular balances
        </button>
      </div>
    </div>
  );
}

const estilos = {
  contenedor: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '20px', fontFamily: 'Courier New, monospace' },
  ticket: { backgroundColor: '#1f2937', color: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxWidth: '400px', width: '100%', border: '4px solid #374151' },
  cabecera: { textSide: 'center', borderBottom: '1px dashed #4b5563', paddingBottom: '15px', marginBottom: '15px' },
  titulo: { margin: '0', fontSize: '22px', fontWeight: '900', letterSpacing: '1px' },
  subtitulo: { margin: '5px 0 0 0', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' },
  fecha: { margin: '10px 0 0 0', fontSize: '13px', color: '#818cf8' },
  bloqueOperaciones: { backgroundColor: '#111827', padding: '15px', borderRadius: '10px', textSide: 'center', marginBottom: '20px' },
  labelOperaciones: { margin: '0', fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' },
  conteo: { margin: '5px 0 0 0', fontSize: '24px', fontWeight: '900', color: '#34d399' },
  desglose: { display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px dashed #4b5563', paddingBottom: '15px', marginBottom: '20px', fontSize: '13px' },
  fila: { display: 'flex', justifyContent: 'space-between', color: '#d1d5db' },
  totalContenedor: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#064e3b', border: '1px solid #047857', padding: '15px', borderRadius: '10px' },
  totalLabel: { margin: '0', fontSize: '11px', fontWeight: 'bold', color: '#34d399' },
  totalSub: { margin: '0', fontSize: '10px', color: '#a7f3d0' },
  totalMonto: { fontSize: '22px', fontWeight: '900', color: '#34d399' },
  botonRefrescar: { w: '100%', marginTop: '20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.2s' }
};
