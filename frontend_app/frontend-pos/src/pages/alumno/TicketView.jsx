import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import theme from '../../theme';
import EscudoLogo from '../../components/EscudoLogo';
import QRDecorativo from '../../components/QRDecorativo';

const TicketView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pedido = location.state?.pedido;

  // Si alguien llega directo a /ticket sin haber hecho un pedido (recarga de página, etc.)
  if (!pedido) {
    return (
      <div style={estilos.centrado}>
        <h2 style={estilos.tituloVacio}>No hay ningún ticket para mostrar</h2>
        <p style={estilos.textoVacio}>
          Esto pasa cuando recargas la página o entras directo a esta sección.
          Tu pedido ya quedó registrado, puedes consultarlo en tu historial.
        </p>
        <button onClick={() => navigate('/menu')} style={estilos.btnVolver}>
          Volver al menú
        </button>
      </div>
    );
  }

  const fecha = new Date(pedido.fecha);
  const fechaTexto = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaTexto = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={estilos.pagina}>
      <div style={estilos.accionesPantalla} className="no-imprimir">
        <button onClick={() => window.print()} style={estilos.btnImprimir}>
          Imprimir ticket
        </button>
        <button onClick={() => navigate('/menu')} style={estilos.btnSecundario}>
          Seguir pidiendo
        </button>
      </div>

      <div style={estilos.ticket} className="ticket-imprimible">
        <div style={estilos.marcaAgua}>CONALEP</div>

        <div style={estilos.bandaVerde}>
          <EscudoLogo color="#ffffff" size={30} />
          <h1 style={estilos.plantelNombre}>Cafetería CONALEP</h1>
        </div>

        <div style={estilos.cuerpo}>
        <header style={estilos.encabezado}>
          <p style={estilos.plantel}>CONALEP HIDALGO &bull; COOPERATIVA ESCOLAR</p>
          <p style={estilos.lineaPunteada}>- - - - - - - - - - - - - - - - - -</p>
        </header>

        <div style={estilos.folioBloque}>
          <span style={estilos.folioLabel}>Folio de tu pedido</span>
          <span style={estilos.folioNumero}>#{String(pedido.id).padStart(5, '0')}</span>
          <span style={estilos.folioAyuda}>Muestra este folio en caja para validar y recoger tu orden</span>
        </div>

        <p style={estilos.lineaPunteada}>- - - - - - - - - - - - - - - - - -</p>

        <div style={estilos.datosAlumno}>
          <p><strong>Alumno:</strong> {pedido.alumno_nombre || '—'}</p>
          <p><strong>Matrícula:</strong> {pedido.matricula || '—'}</p>
          <p><strong>Fecha:</strong> {fechaTexto} &nbsp;&nbsp;<strong>Hora:</strong> {horaTexto}</p>
          <p><strong>Pago:</strong> {pedido.metodo_pago === 'EFECTIVO' ? 'Efectivo en caja' : 'Pago en línea'}</p>
        </div>

        <p style={estilos.lineaPunteada}>- - - - - - - - - - - - - - - - - -</p>

        <table style={estilos.tabla}>
          <thead>
            <tr>
              <th style={estilos.thCant}>Cant</th>
              <th style={estilos.thProd}>Producto</th>
              <th style={estilos.thMonto}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {pedido.detalles.map((item, idx) => (
              <tr key={idx}>
                <td style={estilos.tdCant}>{item.cantidad}</td>
                <td style={estilos.tdProd}>{item.producto_nombre}</td>
                <td style={estilos.tdMonto}>${(item.precio_unitario * item.cantidad).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={estilos.lineaPunteada}>- - - - - - - - - - - - - - - - - -</p>

        <div style={estilos.filaTotal}>
          <span>TOTAL</span>
          <span>${Number(pedido.total).toFixed(2)} MXN</span>
        </div>

        <p style={estilos.lineaPunteada}>- - - - - - - - - - - - - - - - - -</p>

        <p style={{ ...estilos.pie, fontWeight: 'bold', color: '#1b7a3e', fontSize: '13px' }}>¡Gracias por tu compra!</p>

        <div style={estilos.qrContenedor}>
          <QRDecorativo size={100} seed={pedido.id} />
        </div>
        <p style={estilos.qrTexto}>Folio digital · solo de referencia visual</p>

        <p style={estilos.pieChico}>Ticket válido · Cafetería CONALEP · {fecha.getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

const estilos = {
  pagina: { padding: '24px 16px 50px', maxWidth: '460px', margin: '0 auto', fontFamily: theme.fuente },
  accionesPantalla: { display: 'flex', gap: '12px', marginBottom: '20px' },
  btnImprimir: { flex: 1, padding: '12px', backgroundColor: theme.amarillo, color: '#4a3400', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' },
  btnSecundario: { flex: 1, padding: '12px', backgroundColor: '#fff', color: theme.verde, border: `1px solid ${theme.verde}`, borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
  centrado: { textAlign: 'center', marginTop: '100px', padding: '0 20px', fontFamily: theme.fuente },
  tituloVacio: { color: theme.gris900 },
  textoVacio: { color: theme.gris500, maxWidth: '420px', margin: '10px auto 20px' },
  btnVolver: { padding: '10px 20px', backgroundColor: theme.verde, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  ticket: {
    position: 'relative',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
    fontFamily: 'ui-monospace, Consolas, monospace',
    color: '#1a1a1a',
    overflow: 'hidden',
  },
  bandaVerde: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#1b7a3e',
    padding: '18px 20px',
    fontFamily: "'Segoe UI', sans-serif",
  },
  cuerpo: { padding: '20px 20px 24px', position: 'relative' },
  qrContenedor: { display: 'flex', justifyContent: 'center', margin: '14px 0 6px', position: 'relative' },
  qrTexto: { textAlign: 'center', fontSize: '10px', color: '#888', margin: '0 0 14px', position: 'relative' },
  pieChico: { textAlign: 'center', fontSize: '10px', color: '#aaa', margin: '0 0 20px', position: 'relative' },
  marcaAgua: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '56px',
    fontWeight: 'bold',
    color: 'rgba(0, 127, 95, 0.06)',
    transform: 'rotate(-20deg)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
  encabezado: { textAlign: 'center', position: 'relative', marginTop: '4px' },
  plantel: { margin: 0, fontSize: '11px', letterSpacing: '1px', color: '#555' },
  plantelNombre: { margin: 0, fontSize: '17px', color: '#ffffff', fontWeight: 'bold' },
  lineaPunteada: { textAlign: 'center', color: '#999', margin: '10px 0', letterSpacing: '1px' },
  folioBloque: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
  folioLabel: { fontSize: '11px', color: '#555' },
  folioNumero: { fontSize: '30px', fontWeight: 'bold', color: '#1b7a3e', margin: '4px 0' },
  folioAyuda: { fontSize: '11px', color: '#555', textAlign: 'center' },
  datosAlumno: { fontSize: '13px', lineHeight: '1.6', position: 'relative' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', position: 'relative' },
  thCant: { textAlign: 'left', paddingBottom: '6px' },
  thProd: { textAlign: 'left', paddingBottom: '6px' },
  thMonto: { textAlign: 'right', paddingBottom: '6px' },
  tdCant: { padding: '3px 0', verticalAlign: 'top' },
  tdProd: { padding: '3px 0', verticalAlign: 'top' },
  tdMonto: { padding: '3px 0', textAlign: 'right', verticalAlign: 'top' },
  filaTotal: { display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', position: 'relative', backgroundColor: '#f5b014', padding: '8px 10px', borderRadius: '4px' },
  pie: { textAlign: 'center', fontSize: '11px', color: '#555', margin: '4px 0', position: 'relative' },
};

export default TicketView;
