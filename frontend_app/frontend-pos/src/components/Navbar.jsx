import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext'; 
import theme from '../theme';
import EscudoLogo from './EscudoLogo';

const Navbar = () => {
  const { totalArticulos, limpiarCarrito } = useCart(); 
  const navigate = useNavigate();

  // Estados reactivos para controlar el renderizado dinámico
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [esAdmin, setEsAdmin] = useState(localStorage.getItem('esAdmin') === 'true');

  // Escuchamos los cambios en el almacenamiento local de manera reactiva
  useEffect(() => {
    const actualizarNavbar = () => {
      setToken(localStorage.getItem('token'));
      setEsAdmin(localStorage.getItem('esAdmin') === 'true');
    };

    // Escucha eventos del storage del mismo origen
    window.addEventListener('storage', actualizarNavbar);

    return () => {
      window.removeEventListener('storage', actualizarNavbar);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('esAdmin');
    
    // Sincronizamos el estado local de forma inmediata
    setToken(null);
    setEsAdmin(false);
    
    limpiarCarrito(); 
    alert('Sesión cerrada correctamente. ¡Vuelve pronto!');
    navigate('/login');
  };

  return (
    <nav style={esAdmin ? estilos.navAdmin : estilos.nav}>
      {/* Título Institucional / Rol Dinámico */}
      <div style={estilos.marcaContainer}>
        <Link to={esAdmin ? "/cocina/pedidos" : "/menu"} style={estilos.marcaEnlace}>
          <EscudoLogo color="#ffffff" size={28} />
          <span style={estilos.logoTexto}>
            {esAdmin ? "Panel Administrativo" : "Cafetería CONALEP"}
          </span>
        </Link>
      </div>

      {/* Menú de Enlaces Condicionales según el Rol */}
      <div style={estilos.enlacesContainer}>
        
        {/* === INTERFAZ DE ESTUDIANTES === */}
        {!esAdmin && (
          <>
            <Link to="/menu" style={estilos.enlace}>Ver Menú</Link>
            
            {totalArticulos > 0 && (
              <Link to="/carrito" style={estilos.botonCarrito}>
                Mi Pedido 
                <span style={estilos.badgeContador}>{totalArticulos}</span>
              </Link>
            )}
          </>
        )}

      {/* === INTERFAZ DE ADMINISTRADORES (CAJA / COOPERATIVA) === */}
      {token && esAdmin && (
       <>
       <Link to="/cocina/pedidos" style={estilos.enlace}>Gestionar Pedidos</Link>
       <Link to="/cocina/productos/nuevo" style={estilos.enlace}>Nuevo Producto</Link>
       <Link to="/cocina/almacen" style={estilos.enlace}>Registrar Lotes</Link>
       <Link to="/cocina/cierre" style={estilos.enlace}>Cierre Caja</Link>
        <Link to="/cocina/alertas" style={estilos.enlaceCocina}>Alertas de Stock</Link>
      </>
      )}


        {/* === BOTONES GENERALES DE ACCESO === */}
        {token ? (
          <button onClick={handleLogout} style={estilos.btnCerrarSesion}>
            Salir
          </button>
        ) : (
          <Link to="/login" style={estilos.btnIniciarSesion}>
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
};

// Estilos institucionales
const estilos = {
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    background: `linear-gradient(135deg, ${theme.verde}, ${theme.verdeOscuro})`,
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    fontFamily: theme.fuente,
  },
  navAdmin: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    backgroundColor: theme.gris900, 
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    fontFamily: theme.fuente,
  },
  marcaContainer: { display: 'flex', alignItems: 'center' },
  marcaEnlace: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
  logoTexto: {
    color: '#ffffff',
    fontSize: '17px',
    fontWeight: 'bold',
    letterSpacing: '0.3px'
  },
  enlacesContainer: { display: 'flex', alignItems: 'center', gap: '20px' },
  enlace: {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    transition: '0.2s'
  },
  enlaceCocina: {
    color: '#fca5a5', 
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '600'
  },
  botonCarrito: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: theme.amarillo,
    color: '#4a3400',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
  },
  badgeContador: {
    backgroundColor: theme.rojo,
    color: '#ffffff',
    borderRadius: '50%',
    padding: '2px 7px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  btnIniciarSesion: {
    backgroundColor: theme.amarillo,
    color: '#4a3400',
    padding: '8px 16px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  btnCerrarSesion: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.4)',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export default Navbar;
