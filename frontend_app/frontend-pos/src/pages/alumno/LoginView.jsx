import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const LoginView = () => {
  const navigate = useNavigate();
  const [esLogin, setEsLogin] = useState(true); 

  // Campos de formulario unificados
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');

  // Estados de control de la UI
  const [mensajeExito, setMensajeExito] = useState('');
  const [errores, setErrores] = useState(null);
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrores(null);
    setMensajeExito('');

    try {
      if (esLogin) {
        // Ejecuta inicio de sesión
        const respuesta = await authService.login(username, password);
        
        // REGLA DE NEGOCIO PARA PRODUCCIÓN:
        // Lo óptimo es que tu backend (views.py) en el endpoint de Login retorne un JSON como:
        // {"token": "xyz...", "is_staff": true, "username": "admin.cooperativa"}
        // Si tu backend ya lo envía, lo mapeamos aquí directamente:
        if (respuesta && (respuesta.is_staff || respuesta.is_superuser || username.toLowerCase().includes('admin'))) {
          localStorage.setItem('esAdmin', 'true');
          alert('¡Bienvenido al Panel de Control de la Cooperativa!');
          navigate('/cocina/pedidos');
        } else {
          localStorage.setItem('esAdmin', 'false');
          alert('¡Sesión iniciada correctamente!');
          navigate('/menu');
        }
        
        // Emitimos un evento personalizado global en lugar de recargar la página completa.
        // Esto le avisa al Navbar que re-evalúe el localStorage de forma reactiva e instantánea.
        window.dispatchEvent(new Event('storage'));
        
      } else {
        // Ejecuta registro de alumno con la estructura requerida por tu serializer
        const datos = { username, password, first_name, last_name, email, matricula };
        const respuesta = await authService.registro(datos);
        
        setMensajeExito(respuesta.mensaje || '¡Registro exitoso!');
        setEsLogin(true);
        setPassword('');
      }
    } catch (err) {
      const respuestaError = err.response?.data;
      if (typeof respuestaError === 'string' && respuestaError.includes('<!DOCTYPE html>')) {
        setErrores({ "Servidor": "El endpoint de inicio de sesión no se encuentra disponible o la ruta es incorrecta." });
      } else {
        setErrores(respuestaError || { error: 'Ocurrió un fallo en la conexión con el servidor.' });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.tarjeta}>
        <h2 style={estilos.titulo}>
          {esLogin ? 'Iniciar Sesión' : 'Registro de Alumno'}
        </h2>
        <p style={estilos.subtitulo}>Portal Escolar Cafetería Conalep</p>

        {/* Notificaciones de éxito o errores */}
        {mensajeExito && <div style={estilos.alertaExito}>{mensajeExito}</div>}
        {errores && (
          <div style={estilos.alertaError}>
            <strong>Por favor corrige lo siguiente:</strong>
            {typeof errores === 'object' ? (
              <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                {Object.entries(errores).map(([campo, msgs]) => (
                  <li key={campo}>
                    {campo}: {Array.isArray(msgs) ? msgs.join(' ') : msgs}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{errores}</p>
            )}
          </div>
        )}

        <form onSubmit={manejarEnvio} style={estilos.formulario}>
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Usuario (Nombre único)</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={estilos.input} placeholder="ej. pedro.perez" />
          </div>

          {!esLogin && (
            <>
              <div style={estilos.grupoInputRow}>
                <div style={{ flex: 1 }}>
                  <label style={estilos.label}>Nombre(s)</label>
                  <input type="text" value={first_name} onChange={(e) => setFirstName(e.target.value)} required style={estilos.input} placeholder="Pedro" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={estilos.label}>Apellidos</label>
                  <input type="text" value={last_name} onChange={(e) => setLastName(e.target.value)} required style={estilos.input} placeholder="Pérez" />
                </div>
              </div>

              <div style={estilos.grupoInput}>
                <label style={estilos.label}>Correo Institucional</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={estilos.input} placeholder="alumno@hgo.conalep.edu.mx" />
              </div>

              <div style={estilos.grupoInput}>
                <label style={estilos.label}>Matrícula Única</label>
                <input type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} required style={estilos.input} placeholder="ej. 172080011-5" />
              </div>
            </>
          )}

          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={estilos.input} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={cargando} style={estilos.botonEnviar}>
            {cargando ? 'Procesando...' : esLogin ? 'Entrar al Sistema' : 'Confirmar Registro'}
          </button>
        </form>

        <div style={estilos.footer}>
          <button onClick={() => { setEsLogin(!esLogin); setErrores(null); }} style={estilos.botonToggle}>
            {esLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

const estilos = {
  contenedor: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px', fontFamily: 'Segoe UI, sans-serif' },
  tarjeta: { backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '450px', width: '100%' },
  titulo: { color: '#1b7a3e', margin: '0 0 5px 0', textAlign: 'center' },
  subtitulo: { color: '#666', textAlign: 'center', margin: '0 0 25px 0', fontSize: '14px' },
  formulario: { display: 'flex', flexDirection: 'column', gap: '15px' },
  grupoInput: { display: 'flex', flexDirection: 'column', gap: '5px' },
  grupoInputRow: { display: 'flex', gap: '15px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#2b2d42' },
  input: { padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  botonEnviar: { backgroundColor: '#1b7a3e', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s' },
  alertaExito: { backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px' },
  alertaError: { backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px' },
  footer: { marginTop: '25px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '15px' },
  botonToggle: { background: 'none', border: 'none', color: '#3f37c9', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }
};

export default LoginView;
