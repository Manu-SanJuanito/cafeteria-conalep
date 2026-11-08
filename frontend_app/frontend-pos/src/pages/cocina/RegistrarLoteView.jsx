import React, { useState, useEffect } from 'react';
import cocinaService from '../../services/cocinaService';

export default function RegistrarLoteView() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Al cargar la pantalla traemos el catálogo de productos disponibles en el Conalep
  useEffect(() => {
    cocinaService.obtenerProductosSimple()
      .then(data => setProductos(data || []))
      .catch((err) => {
        console.error(err);
        setMensaje({ texto: 'Error al cargar el catálogo de productos desde el servidor.', tipo: 'error' });
      });
  }, []);

  const handleGuardarLote = async (e) => {
    e.preventDefault();
    
    // Validación en cliente para evitar datos nulos o vacíos
    if (!productoSeleccionado || !cantidad || !fechaCaducidad) {
      setMensaje({ texto: 'Por favor, completa todos los campos del formulario.', tipo: 'error' });
      return;
    }

    try {
      setCargando(true);
      setMensaje({ texto: '', tipo: '' });
      
      const respuesta = await cocinaService.registrarLote(
        productoSeleccionado,
        cantidad,
        fechaCaducidad
      );

      // Si todo sale bien, informamos el incremento de stock real
      setMensaje({ texto: respuesta.mensaje || '¡Lote registrado con éxito!', tipo: 'exito' });
      
      // Limpiamos los campos para agilizar el registro del siguiente producto
      setCantidad('');
      setFechaCaducidad('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error de conexión al registrar el lote en Django.';
      setMensaje({ texto: `${errorMsg}`, tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.tarjeta}>
        <div style={estilos.cabecera}>
          <h1 style={estilos.titulo}>Entrada de Almacén (PEPS)</h1>
          <p style={estilos.subtitulo}>Registra la llegada de mercancía real con su fecha de caducidad.</p>
        </div>

        {mensaje.texto && (
          <div style={mensaje.tipo === 'exito' ? estilos.alertaExito : estilos.alertaError}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleGuardarLote} style={estilos.formulario}>
          {/* Selector de Producto */}
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Seleccionar Producto</label>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              style={estilos.input}
              required
            >
              <option value="">-- Elige un producto del catálogo --</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Cantidad de piezas */}
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Cantidad de Unidades (Piezas)</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="ej. 50"
              style={estilos.input}
              required
            />
          </div>

          {/* Fecha de vencimiento */}
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Fecha de Caducidad</label>
            <input
              type="date"
              value={fechaCaducidad}
              onChange={(e) => setFechaCaducidad(e.target.value)}
              style={estilos.input}
              required
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando}
            style={cargando ? estilos.botonDeshabilitado : estilos.botonEnviar}
          >
            {cargando ? 'Guardando en Almacén...' : 'Registrar Lote e Incrementar Stock'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Estilos limpios y consistentes
const estilos = {
  contenedor: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '20px', fontFamily: 'Segoe UI, sans-serif' },
  tarjeta: { backgroundColor: '#fff', padding: '35px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '480px', width: '100%' },
  cabecera: { textSide: 'center', marginBottom: '20px' },
  titulo: { color: '#1f2937', margin: '0 0 5px 0', fontSize: '22px', fontStyle: 'bold', textSide: 'center' },
  subtitulo: { color: '#666', textSide: 'center', margin: '0', fontSize: '13px' },
  formulario: { display: 'flex', flexDirection: 'column', gap: '15px' },
  grupoInput: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#374151', uppercase: 'true' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb' },
  botonEnviar: { backgroundColor: '#1b7a3e', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s' },
  botonDeshabilitado: { backgroundColor: '#9ca3af', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'not-allowed', marginTop: '10px' },
  alertaExito: { backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', fontWeight: '600', border: '1px solid #a7f3d0' },
  alertaError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', fontWeight: '600', border: '1px solid #fca5a5' }
};
