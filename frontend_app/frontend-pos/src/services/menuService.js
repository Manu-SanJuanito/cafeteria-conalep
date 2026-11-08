import API from './api';

const menuService = {
  // 1. Obtener el menú público organizado por categorías con sus stocks dinámicos
  obtenerMenu: async () => {
    try {
      const respuesta = await API.get('/menu/');
      return respuesta.data;
    } catch (error) {
      console.error('Error al cargar el menú desde Django:', error.response?.data || error.message);
      throw error;
    }
  },

  // 2. Obtener las alertas de inventario crítico para la cocina
  obtenerAlertasStock: async () => {
    try {
      const respuesta = await API.get('/cocina/alertas-stock/');
      return respuesta.data;
    } catch (error) {
      console.error('Error al cargar alertas de stock desde Django:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default menuService;
