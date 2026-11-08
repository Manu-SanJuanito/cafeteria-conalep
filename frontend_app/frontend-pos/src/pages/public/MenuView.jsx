import React, { useEffect, useState } from 'react';
import menuService from '../../services/menuService';
import { useCart } from '../../contexts/CartContext';
import theme from '../../theme';

// Un set de colores para rotar el "ícono" de cada producto ya que no usamos fotos
const coloresIcono = ['#1b7a3e', '#f5b014', '#3f37c9', '#d90429', '#0ea5a3', '#6d28d9'];
const colorParaProducto = (nombre) => {
  const codigo = nombre.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return coloresIcono[codigo % coloresIcono.length];
};

const MenuView = () => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const { carrito, agregarAlCarrito, restarCantidad } = useCart();

  useEffect(() => {
    const cargarDatosMenu = async () => {
      try {
        const datos = await menuService.obtenerMenu();
        setCategorias(datos);
      } catch (err) {
        setError('No se pudo conectar con el servidor de la cafetería.');
      } finally {
        setCargando(false);
      }
    };

    cargarDatosMenu();
  }, []);

  const obtenerCantidadEnCarrito = (id) => {
    const item = carrito.find((prod) => prod.id === id);
    return item ? item.cantidad : 0;
  };

  if (cargando) {
    return <div style={estilos.centrado}><h3>Cargando el menú del CONALEP...</h3></div>;
  }

  if (error) {
    return <div style={estilos.centrado}><h3 style={{ color: theme.rojo }}>{error}</h3><p>Verifica que el backend de Django esté encendido.</p></div>;
  }

  const terminoBusqueda = busqueda.trim().toLowerCase();
  const categoriasFiltradas = terminoBusqueda
    ? categorias
        .map((cat) => ({
          ...cat,
          productos: (cat.productos || []).filter((p) =>
            p.nombre.toLowerCase().includes(terminoBusqueda)
          ),
        }))
        .filter((cat) => cat.productos.length > 0)
    : categorias;

  return (
    <div style={estilos.contenedor}>
      <header style={estilos.header}>
        <h1 style={estilos.titulo}>Menú del día</h1>
        <p style={estilos.subtitulo}>Arma tu pedido y recógelo en caja cuando esté listo</p>
      </header>

      <div style={estilos.buscadorContenedor}>
        <span style={estilos.buscadorIcono}>&#128269;</span>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar comida, bebida, antojitos..."
          style={estilos.buscadorInput}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} style={estilos.buscadorLimpiar}>
            &times;
          </button>
        )}
      </div>

      {categorias.length === 0 ? (
        <p style={estilos.sinDatos}>No hay categorías o productos registrados en este momento.</p>
      ) : categoriasFiltradas.length === 0 ? (
        <p style={estilos.sinDatos}>No encontramos productos que coincidan con "{busqueda}".</p>
      ) : (
        categoriasFiltradas.map((cat) => (
          <section key={cat.id} style={estilos.seccionCategoria}>
            <h2 style={estilos.tituloCategoria}>{cat.nombre}</h2>
            <div style={estilos.listaProductos}>
              {cat.productos && cat.productos.map((prod) => {
                const cantidadCarrito = obtenerCantidadEnCarrito(prod.id);
                const stockDisponibleReal = prod.stock_disponible;
                const agotado = !prod.es_preparado && stockDisponibleReal <= 0;

                return (
                  <div key={prod.id} style={estilos.tarjetaProducto}>
                    <div style={{ ...estilos.iconoProducto, backgroundColor: colorParaProducto(prod.nombre) }}>
                      {prod.nombre.charAt(0).toUpperCase()}
                    </div>

                    <div style={estilos.infoProducto}>
                      <h3 style={estilos.nombreProd}>{prod.nombre}</h3>
                      <p style={estilos.descripcion}>{prod.descripcion || 'Sin descripción disponible.'}</p>
                      <div style={estilos.filaPrecioBadge}>
                        <span style={estilos.precio}>${prod.precio}</span>
                        {prod.es_preparado ? (
                          <span style={estilos.badgePreparado}>Al momento</span>
                        ) : stockDisponibleReal > 0 ? (
                          <span style={estilos.badgeDisponible}>{stockDisponibleReal} disp.</span>
                        ) : (
                          <span style={estilos.badgeAgotado}>Agotado</span>
                        )}
                      </div>
                    </div>

                    <div style={estilos.contenedorAcciones}>
                      {cantidadCarrito > 0 ? (
                        <div style={estilos.selectorCantidad}>
                          <button onClick={() => restarCantidad(prod.id)} style={estilos.btnMenos}>-</button>
                          <span style={estilos.cantidadTexto}>{cantidadCarrito}</span>
                          <button
                            onClick={() => agregarAlCarrito(prod)}
                            disabled={!prod.es_preparado && cantidadCarrito >= stockDisponibleReal}
                            style={estilos.btnMas}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => agregarAlCarrito(prod)}
                          disabled={agotado}
                          style={agotado ? estilos.btnAgregarDeshabilitado : estilos.btnAgregar}
                        >
                          {agotado ? 'Agotado' : '+ Agregar'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

const estilos = {
  contenedor: { padding: '20px 16px 50px', maxWidth: '720px', margin: '0 auto', fontFamily: theme.fuente },
  header: { marginBottom: '18px' },
  titulo: { color: theme.gris900, margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800' },
  subtitulo: { color: theme.gris500, margin: 0, fontSize: '14px' },
  centrado: { textAlign: 'center', marginTop: '100px', fontFamily: theme.fuente },

  buscadorContenedor: { position: 'relative', marginBottom: '26px' },
  buscadorIcono: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', opacity: 0.6 },
  buscadorInput: { width: '100%', boxSizing: 'border-box', padding: '13px 40px', borderRadius: '12px', border: `1px solid ${theme.gris300}`, fontSize: '14px', outline: 'none', backgroundColor: theme.gris100 },
  buscadorLimpiar: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', fontSize: '20px', color: theme.gris500, cursor: 'pointer', lineHeight: 1 },

  seccionCategoria: { marginBottom: '28px' },
  tituloCategoria: { color: theme.gris900, fontSize: '17px', fontWeight: '800', borderLeft: `4px solid ${theme.verde}`, paddingLeft: '10px', marginBottom: '14px' },

  listaProductos: { display: 'flex', flexDirection: 'column', gap: '12px' },
  tarjetaProducto: { display: 'flex', alignItems: 'center', gap: '14px', border: `1px solid ${theme.gris300}`, borderRadius: '14px', padding: '14px', backgroundColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  iconoProducto: { width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: '800', flexShrink: 0 },

  infoProducto: { flex: 1, minWidth: 0 },
  nombreProd: { margin: '0 0 2px 0', color: theme.gris900, fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  descripcion: { fontSize: '12px', color: theme.gris500, margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  filaPrecioBadge: { display: 'flex', alignItems: 'center', gap: '10px' },
  precio: { fontSize: '16px', fontWeight: '800', color: theme.verde },

  badgePreparado: { backgroundColor: theme.verdeClaro, color: theme.verde, padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold' },
  badgeDisponible: { backgroundColor: theme.azulClaro, color: theme.azul, padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold' },
  badgeAgotado: { backgroundColor: theme.rojoClaro, color: theme.rojo, padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold' },
  sinDatos: { textAlign: 'center', color: theme.gris500, fontStyle: 'italic' },

  contenedorAcciones: { flexShrink: 0 },
  btnAgregar: { padding: '9px 14px', backgroundColor: theme.amarillo, color: '#4a3400', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnAgregarDeshabilitado: { padding: '9px 14px', backgroundColor: theme.gris300, color: theme.gris500, border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'not-allowed', whiteSpace: 'nowrap' },
  selectorCantidad: { display: 'flex', alignItems: 'center', border: `1px solid ${theme.verde}`, borderRadius: '8px', overflow: 'hidden' },
  btnMenos: { padding: '8px 13px', backgroundColor: theme.gris100, border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  btnMas: { padding: '8px 13px', backgroundColor: theme.verdeClaro, color: theme.verde, border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  cantidadTexto: { fontWeight: 'bold', fontSize: '14px', color: theme.gris900, padding: '0 8px' },
};

export default MenuView;
