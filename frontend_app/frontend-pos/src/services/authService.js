import API from './api';

const authService = {
  // 1. Iniciar sesión (Login)
  login: async (username, password) => {
    try {
      // Ajusta la ruta '/auth/login/' según el nombre exacto que tenga tu endpoint de login de DRF
      const respuesta = await API.post('/auth/login/', { username, password });
      
      // Guardamos el token en el almacenamiento local del navegador
      if (respuesta.data.token) {
        localStorage.setItem('token', respuesta.data.token);
      }
      return respuesta.data;
    } catch (error) {
      console.error('Error en login:', error.response?.data || error.message);
      throw error;
    }
  },

  // 2. Registro de alumno (@hgo.conalep.edu.mx)
  registro: async (datosAlumno) => {
    try {
      // Consume tu endpoint RegistroAlumnoView validado al 100%
      const respuesta = await API.post('/auth/registro/', datosAlumno);
      return respuesta.data;
    } catch (error) {
      console.error('Error en registro:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default authService;
