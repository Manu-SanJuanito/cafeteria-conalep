import React, { useState, useEffect } from 'react';
import cocinaService from '../../services/cocinaService';
import theme from '../../theme';

export default function GestionPedidosView() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  const cargarPedidosInicial = async () => {
    try {
      setCargando(true);
      const data = await cocinaService.obtenerPedidos();
      setPedidos(data || []);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los pedidos de la cocina.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidosInicial();

    const intervalo = setInterval(() => {
      cocinaService.obtenerPedidos()
        .then(data => { if (data) setPedidos(data); })
        .catch(err => console.error("Error en auto-refresco:", err));
    }, 15000);

    return () => clearInterval(intervalo);
  }, []);

  // Función para avanzar de estado de forma segura
  const handleCambiarEstado = async (pedidoId, estadoActual, pagoConfirmadoActual) => {
    let siguienteEstado = '';

    if (estadoActual === 'PENDIENTE') siguienteEstado = 'PREPARANDO';
    else if (estadoActual === 'PREPARANDO') siguienteEstado = 'LISTO';
    else if (estadoActual === 'LISTO') siguienteEstado = 'ENTREGADO';
    else return;

    if (siguienteEstado === 'ENTREGADO' && !pagoConfirmadoActual) {
      alert('Primero cobra en caja con el botón "Recibir y Confirmar", luego ya puedes entregar.');
      return;
    }

    try {
      await cocinaService.actualizarEstadoPedido(pedidoId, siguienteEstado, pagoConfirmadoActual);
      const datosActualizados = await cocinaService.obtenerPedidos();
      setPedidos(datosActualizados || []);
    } catch (err) {
      const apiError = err.response?.data?.pago_confirmado || err.response?.data?.error;
      alert(apiError || 'Error al actualizar el estado del pedido.');
    }
  };

  // Función exclusiva para cobrar el dinero en caja física
  const handleMarcarComoPagado = async (pedidoId, estadoActual) => {
    try {
      await cocinaService.actualizarEstadoPedido(pedidoId, estadoActual, true);
      // Actualización optimista, no esperamos al GET
      setPedidos(prev => prev.map(p =>
        p.id === pedidoId ? { ...p, pago_confirmado: true } : p
      ));
    } catch (err) {
      alert('Error al registrar el cobro en efectivo.');
    }
  };

  const pedidosFiltrados = filtroEstado === 'TODOS' ? pedidos : pedidos.filter(p => p.estado === filtroEstado);

  const estilosPorEstado = {
    PENDIENTE: { backgroundColor: theme.amarilloClaro, color: '#92650a', borderColor: '#f3d38a' },
    PREPARANDO: { backgroundColor: theme.azulClaro, color: theme.azul, borderColor: '#c7d2fe' },
    LISTO: { backgroundColor: theme.verdeClaro, color: theme.verde, borderColor: '#bfe4cc' },
    ENTREGADO: { backgroundColor: theme.gris100, color: theme.gris500, borderColor: theme.gris300 },
  };

  const textoBotonSiguiente = {
    PENDIENTE: 'Empezar a Preparar',
    PREPARANDO: 'Marcar Listo',
    LISTO: 'Entregar',
  };

  if (cargando) return <div style={estilos.centrado}>Cargando panel de caja y cocina...</div>;
  if (error) return <div style={{ ...estilos.centrado, color: theme.rojo }}>{error}</div>;

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.encabezadoFila}>
        <div>
          <h1 style={estilos.titulo}>Cocina · Pedidos</h1>
          <p style={estilos.subtitulo}>Validación de cobros en efectivo y despacho seguro de inventario (PEPS).</p>
        </div>
        <button onClick={cargarPedidosInicial} style={estilos.btnRefrescar}>
          Refrescar
        </button>
      </div>

      {/* Selectores de Filtro */}
      <div style={estilos.filtros}>
        {['TODOS', 'PENDIENTE', 'PREPARANDO', 'LISTO', 'ENTREGADO'].map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            style={filtroEstado === est ? estilos.filtroActivo : estilos.filtroInactivo}
          >
            {est === 'TODOS' ? 'Ver Todos' : est}
          </button>
        ))}
      </div>

      {/* Lista de Pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div style={estilos.vacio}>No hay órdenes registradas bajo este estado.</div>
      ) : (
        <div style={estilos.grid}>
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} style={estilos.tarjeta}>
              <div style={estilos.barraLateral} />
              <div style={estilos.contenidoTarjeta}>
                <div style={estilos.filaEncabezado}>
                  <div>
                    <span style={estilos.ordenLabel}>ORDEN</span>
                    <h2 style={estilos.ordenNumero}>#{pedido.id}</h2>
                  </div>
                  <span style={{ ...estilos.badge, ...estilosPorEstado[pedido.estado] }}>
                    {pedido.estado}
                  </span>
                </div>

                <div style={estilos.infoAlumno}>
                  <p style={{ margin: 0 }}><strong>{pedido.alumno_nombre || 'Estudiante'}</strong></p>
                  <p style={estilos.hora}>{new Date(pedido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</p>
                </div>

                <div style={estilos.bloquePago}>
                  <div>
                    <p style={estilos.pagoLabel}>Método de Pago</p>
                    <p style={estilos.pagoValor}>{pedido.metodo_pago}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={estilos.pagoLabel}>Estado</p>
                    {pedido.pago_confirmado ? (
                      <span style={estilos.pagadoBadge}>Pagado</span>
                    ) : (
                      <span style={estilos.pendienteBadge}>Pendiente en caja</span>
                    )}
                  </div>
                </div>

                <div style={estilos.listaProductos}>
                  <p style={estilos.productosLabel}>Artículos:</p>
                  {pedido.detalles?.map((det, index) => (
                    <div key={index} style={estilos.filaProducto}>
                      <strong style={{ color: theme.verde }}>{det.cantidad}x</strong> {det.producto_nombre}
                    </div>
                  ))}
                  <div style={estilos.totalFila}>Total: ${pedido.total}</div>
                </div>
              </div>

              <div style={estilos.botonera}>
                {pedido.metodo_pago === 'EFECTIVO' && !pedido.pago_confirmado && pedido.estado === 'LISTO' && (
                  <button onClick={() => handleMarcarComoPagado(pedido.id, pedido.estado)} style={estilos.btnCobrar}>
                    Recibir y Confirmar ${pedido.total}
                  </button>
                )}

                {pedido.estado !== 'ENTREGADO' ? (
                  <button
                    onClick={() => handleCambiarEstado(pedido.id, pedido.estado, pedido.pago_confirmado)}
                    style={pedido.estado === 'LISTO' ? estilos.btnEntregar : estilos.btnAvanzar}
                  >
                    {textoBotonSiguiente[pedido.estado]}
                  </button>
                ) : (
                  <div style={estilos.entregadoAviso}>Entregado · inventario descontado</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const estilos = {
  contenedor: { padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: theme.fuente },
  centrado: { textAlign: 'center', padding: '60px 20px', fontSize: '16px', fontWeight: '600', color: theme.gris700 },
  encabezadoFila: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  titulo: { fontSize: '26px', fontWeight: '800', color: theme.gris900, margin: '0 0 4px' },
  subtitulo: { color: theme.gris500, fontSize: '13px', margin: 0 },
  btnRefrescar: { backgroundColor: theme.verde, color: '#fff', fontWeight: '600', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer' },

  filtros: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' },
  filtroActivo: { padding: '8px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', border: `1px solid ${theme.gris900}`, backgroundColor: theme.gris900, color: '#fff', cursor: 'pointer' },
  filtroInactivo: { padding: '8px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', border: `1px solid ${theme.gris300}`, backgroundColor: '#fff', color: theme.gris700, cursor: 'pointer' },

  vacio: { textAlign: 'center', padding: '50px 20px', border: `2px dashed ${theme.gris300}`, borderRadius: '12px', color: theme.gris500, fontWeight: '600' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },

  tarjeta: { display: 'flex', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: `1px solid ${theme.gris300}`, overflow: 'hidden' },
  barraLateral: { width: '6px', backgroundColor: theme.verde, flexShrink: 0 },
  contenidoTarjeta: { padding: '18px', flex: 1 },

  filaEncabezado: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  ordenLabel: { fontSize: '11px', fontWeight: '700', color: theme.gris500, letterSpacing: '0.5px' },
  ordenNumero: { fontSize: '22px', fontWeight: '800', color: theme.gris900, margin: 0 },
  badge: { fontSize: '11px', fontWeight: '800', padding: '5px 12px', borderRadius: '999px', border: '1px solid' },

  infoAlumno: { marginBottom: '12px', paddingBottom: '10px', borderBottom: `1px solid ${theme.gris100}`, fontSize: '14px', color: theme.gris700 },
  hora: { fontSize: '12px', color: theme.gris500, margin: '2px 0 0' },

  bloquePago: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.gris100, borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' },
  pagoLabel: { fontSize: '10px', fontWeight: '700', color: theme.gris500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' },
  pagoValor: { fontSize: '14px', fontWeight: '800', color: theme.gris900, margin: 0 },
  pagadoBadge: { fontSize: '11px', fontWeight: '700', color: theme.verde, backgroundColor: theme.verdeClaro, padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfe4cc' },
  pendienteBadge: { fontSize: '11px', fontWeight: '700', color: '#92650a', backgroundColor: theme.amarilloClaro, padding: '3px 8px', borderRadius: '6px', border: '1px solid #f3d38a' },

  listaProductos: { marginBottom: '6px' },
  productosLabel: { fontSize: '11px', fontWeight: '700', color: theme.gris500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' },
  filaProducto: { fontSize: '14px', color: theme.gris700, padding: '4px 0' },
  totalFila: { textAlign: 'right', fontWeight: '800', fontSize: '15px', color: theme.gris900, paddingTop: '8px', marginTop: '6px', borderTop: `1px dashed ${theme.gris300}` },

  botonera: { padding: '14px 18px', borderTop: `1px solid ${theme.gris100}`, display: 'flex', flexDirection: 'column', gap: '8px' },
  btnCobrar: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: theme.verde, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  btnAvanzar: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: theme.amarillo, color: '#4a3400', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  btnEntregar: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: theme.verde, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  entregadoAviso: { textAlign: 'center', fontSize: '12px', fontWeight: '700', color: theme.gris500, backgroundColor: theme.gris100, padding: '10px', borderRadius: '8px' },
};
