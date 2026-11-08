import React, { useEffect, useState } from 'react';
import menuService from '../../services/menuService';

const AlertasStockView = () => {
  const [datosAlertas, setDatosAlertas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        // Nota: usa obtenerAlertasStock()
        const datos = await menuService.obtenerAlertasStock();
        setDatosAlertas(datos);
      } catch (err) {
        setError('No se pudieron recuperar las alertas. Verifica tus permisos de administrador o vuelve a iniciar sesión.');
      } finally {
        setCargando(false);
      }
    };

    cargarAlertas();
  }, []); // El arreglo vacío para que solo llame a Django una vez al montar

  if (cargando) {
    return <div style={estilos.centrado}><h3>Analizando inventario de almacén...</h3></div>;
  }

  if (error) {
    return <div style={estilos.centrado}><h3 style={{ color: '#d90429' }}>{error}</h3><p>Asegúrate de haber iniciado sesión con tu cuenta de Administrador/Staff en la pestaña de Login de React.</p></div>;
  }

  const { conteo_alertas, productos_criticos } = datosAlertas || { conteo_alertas: 0, productos_criticos: [] };

  return (
    <div style={estilos.contenedor}>
      <header style={estilos.header}>
        <h1 style={estilos.titulo}>Panel de Control: Alertas de Stock</h1>
        <p style={estilos.subtitulo}>Monitoreo en tiempo real para el personal de cocina</p>
      </header>

      {/* Tarjeta de Resumen con Contador */}
      <div style={conteo_alertas > 0 ? estilos.tarjetaResumenAlerta : estilos.tarjetaResumenOk}>
        <span style={{ fontSize: '32px' }}>{conteo_alertas > 0 ? '!' : 'OK'}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px' }}>
            {conteo_alertas === 0 ? 'Inventario Óptimo' : `${conteo_alertas} Alertas Críticas`}
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#555' }}>
            {conteo_alertas === 0 
              ? 'Todos los productos físicos se encuentran por encima del stock mínimo estipulado.' 
              : 'Los siguientes insumos requieren reabastecimiento inmediato para evitar la suspensión de ventas.'}
          </p>
        </div>
      </div>

      {/* Tabla de Productos Críticos */}
      {productos_criticos.length > 0 && (
        <div style={estilos.contenedorTabla}>
          <table style={estilos.tabla}>
            <thead>
              <tr style={estilos.encabezadoTabla}>
                <th style={estilos.th}>ID</th>
                <th style={estilos.th}>Producto</th>
                <th style={estilos.th}>Categoría</th>
                <th style={estilos.th}>Stock Mínimo</th>
                <th style={estilos.th}>Existencias Reales</th>
                <th style={estilos.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productos_criticos.map((prod) => (
                <tr key={prod.id} style={estilos.fila}>
                  <td style={estilos.td}>#{prod.id}</td>
                  <td style={{ ...estilos.td, fontWeight: 'bold', color: '#2b2d42' }}>{prod.nombre}</td>
                  <td style={estilos.td}><span style={estilos.badgeCat}>{prod.categoria || 'General'}</span></td>
                  <td style={estilos.td}>{prod.stock_minimo_alerta} pzas</td>
                  <td style={{ ...estilos.td, color: '#d90429', fontWeight: 'bold' }}>{prod.stock_actual} pzas</td>
                  <td style={estilos.td}>
                    <span style={prod.stock_actual === 0 ? estilos.badgeAgotado : estilos.badgeCritico}>
                      {prod.stock_actual === 0 ? 'Agotado' : 'Stock Bajo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const estilos = {
  contenedor: { padding: '30px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
  header: { marginBottom: '30px', borderBottom: '3px solid #ffb703', paddingBottom: '15px' },
  titulo: { color: '#2b2d42', margin: '0 0 5px 0' },
  subtitulo: { color: '#666', margin: 0 },
  centrado: { textAlign: 'center', marginTop: '100px', fontFamily: 'Segoe UI, sans-serif' },
  tarjetaResumenAlerta: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#fff3cd', borderLeft: '6px solid #ffb703', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tarjetaResumenOk: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#d4edda', borderLeft: '6px solid #28a745', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  contenedorTabla: { backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tabla: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '15px' },
  encabezadoTabla: { backgroundColor: '#2b2d42', color: '#fff' },
  th: { padding: '15px 20px', fontWeight: '600' },
  fila: { borderBottom: '1px solid #eee', transition: 'background 0.2s' },
  td: { padding: '15px 20px', color: '#555' },
  badgeCat: { backgroundColor: '#f1f3f5', color: '#495057', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  badgeCritico: { backgroundColor: '#fff0f0', color: '#e63946', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  badgeAgotado: { backgroundColor: '#2b2d42', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }
};

export default AlertasStockView;
