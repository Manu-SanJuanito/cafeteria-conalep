import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import pedidoService from '../../services/pedidoService';
import { useNavigate } from 'react-router-dom';
import theme from '../../theme';

const CartView = () => {
  const { carrito, restarCantidad, agregarAlCarrito, eliminarDelCarrito, montoTotal, limpiarCarrito } = useCart();
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [procesando, setProcesando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const navigate = useNavigate();

  const handleConfirmarPedido = async () => {
    if (carrito.length === 0) return;

    setProcesando(true);
    setErrorServidor(null);

    try {
      // Enviamos el pedido seguro a Django DRF
      const respuesta = await pedidoService.crearPedido(carrito, metodoPago);
      limpiarCarrito();
      // Lo mandamos directo a su ticket digital, con los datos del pedido ya creado
      navigate('/ticket', { state: { pedido: respuesta } });
    } catch (err) {
      // Capturamos el ValidationError estructurado de tu serializer de Django
      if (err.stock) {
        setErrorServidor(err.stock);
      } else if (err.error) {
        setErrorServidor(err.error);
      } else {
        setErrorServidor('No se pudo procesar el pedido. Verifica tu conexión o stock.');
      }
    } finally {
      setProcesando(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div style={estilos.centrado}>
        <h2>Tu carrito está vacío</h2>
        <p>Regresa al menú para agregar los mejores productos del CONALEP.</p>
        <button onClick={() => navigate('/menu')} style={estilos.btnVolver}>Ver Menú</button>
      </div>
    );
  }

  return (
    <div style={estilos.contenedor}>
      <header style={estilos.header}>
        <h1 style={estilos.titulo}>Resumen de tu Pedido</h1>
        <p style={estilos.subtitulo}>Verifica tus artículos antes de enviar a la cocina</p>
      </header>

      {errorServidor && <div style={estilos.alertaError}>{errorServidor}</div>}

      <div style={estilos.layout}>
        {/* Lista de productos */}
        <div style={estilos.listaProductos}>
          {carrito.map((item) => (
            <div key={item.id} style={estilos.tarjetaItem}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: theme.gris900 }}>{item.nombre}</h3>
                <span style={estilos.precioUnitario}>${item.precio} MXN c/u</span>
              </div>

              <div style={estilos.controles}>
                <div style={estilos.selectorCantidad}>
                  <button onClick={() => restarCantidad(item.id)} style={estilos.btnMenos}>-</button>
                  <span style={estilos.cantidadTexto}>{item.cantidad}</span>
                  <button
                    onClick={() => agregarAlCarrito(item)}
                    disabled={!item.es_preparado && item.cantidad >= item.stock_disponible}
                    style={estilos.btnMas}
                  >
                    +
                  </button>
                </div>
                <button onClick={() => eliminarDelCarrito(item.id)} style={estilos.btnEliminar}>Quitar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Panel de checkout */}
        <div style={estilos.panelCheckout}>
          <h3 style={estilos.tituloCheckout}>Total de la Orden</h3>
          <div style={estilos.filaTotal}>
            <span>Total a pagar:</span>
            <span style={estilos.montoTotal}>${montoTotal.toFixed(2)} MXN</span>
          </div>

          <div style={estilos.seccionPago}>
            <label style={estilos.label}>Método de Pago:</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              style={estilos.select}
            >
              <option value="EFECTIVO">Efectivo (Pago en Caja)</option>
              <option value="LINEA" disabled>Tarjeta / Digital (Próximamente)</option>
            </select>
            <small style={estilos.notaPago}>
              * Al seleccionar Efectivo, tu orden quedará pendiente hasta que pagues en barra.
            </small>
          </div>

          <button
            onClick={handleConfirmarPedido}
            disabled={procesando}
            style={procesando ? estilos.btnDeshabilitado : estilos.btnConfirmar}
          >
            {procesando ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

const estilos = {
  contenedor: { padding: '24px 16px 50px', maxWidth: '640px', margin: '0 auto', fontFamily: theme.fuente },
  header: { marginBottom: '22px' },
  titulo: { color: theme.gris900, margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' },
  subtitulo: { color: theme.gris500, margin: 0, fontSize: '14px' },
  centrado: { textAlign: 'center', marginTop: '120px', fontFamily: theme.fuente, padding: '0 20px' },
  btnVolver: { marginTop: '20px', padding: '10px 20px', backgroundColor: theme.verde, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  layout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  listaProductos: { display: 'flex', flexDirection: 'column', gap: '12px' },
  tarjetaItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${theme.gris300}`, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  precioUnitario: { color: theme.verde, fontWeight: '600', fontSize: '13px' },
  controles: { display: 'flex', alignItems: 'center', gap: '10px' },
  selectorCantidad: { display: 'flex', alignItems: 'center', border: `1px solid ${theme.verde}`, borderRadius: '8px', overflow: 'hidden' },
  btnMenos: { padding: '6px 12px', backgroundColor: theme.gris100, border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  btnMas: { padding: '6px 12px', backgroundColor: theme.verdeClaro, color: theme.verde, border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  cantidadTexto: { padding: '0 10px', fontWeight: 'bold' },
  btnEliminar: { background: 'none', border: `1px solid ${theme.rojo}`, color: theme.rojo, borderRadius: '8px', padding: '7px 10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  panelCheckout: { backgroundColor: '#fff', padding: '20px', borderRadius: '14px', border: `1px solid ${theme.gris300}`, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  tituloCheckout: { marginTop: 0, color: theme.gris900, fontSize: '16px', borderBottom: `2px solid ${theme.gris100}`, paddingBottom: '10px' },
  filaTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0', fontSize: '15px', fontWeight: 'bold' },
  montoTotal: { color: theme.verde, fontSize: '22px' },
  seccionPago: { marginBottom: '20px', padding: '14px 0', borderTop: `1px solid ${theme.gris100}` },
  label: { fontWeight: 'bold', display: 'block', marginBottom: '8px', color: theme.gris900, fontSize: '13px' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.gris300}`, fontSize: '14px' },
  notaPago: { color: theme.gris500, marginTop: '6px', display: 'block', fontSize: '12px' },
  btnConfirmar: { width: '100%', padding: '13px', backgroundColor: theme.amarillo, color: '#4a3400', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' },
  btnDeshabilitado: { width: '100%', padding: '13px', backgroundColor: theme.gris300, color: theme.gris500, border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'not-allowed' },
  alertaError: { padding: '13px', backgroundColor: theme.rojoClaro, color: theme.rojo, borderRadius: '8px', marginBottom: '18px', fontWeight: 'bold', fontSize: '13px' }
};

export default CartView;
