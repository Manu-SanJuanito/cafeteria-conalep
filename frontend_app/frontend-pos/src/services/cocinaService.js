import api from './api'; // Tu instancia configurada de Axios con el interceptor de tokens

const cocinaService = {
  /**
   * Obtiene todos los pedidos registrados en el sistema ordenados por fecha
   */
  obtenerPedidos: async () => {
    try {
      const response = await api.get('/cocina/pedidos/'); 
      return response.data;
    } catch (error) {
      console.error('Error al obtener pedidos de cocina:', error);
      throw error;
    }
  },

  /**
   * Actualiza el estado y/o la confirmación de pago de un pedido específico
   * @param {number} pedidoId - ID del pedido
   * @param {string} nuevoEstado - El nuevo estado a asignar (PENDIENTE, PREPARANDO, LISTO, ENTREGADO)
   * @param {boolean|null} pagoConfirmado - Si el dinero ya ingresó a caja física (opcional)
   */
  actualizarEstadoPedido: async (pedidoId, nuevoEstado, pagoConfirmado = null) => {
    try {
      const payload = { estado: nuevoEstado };
      
      // Si explícitamente mandamos una actualización de pago, la incluimos en el cuerpo
      if (pagoConfirmado !== null) {
        payload.pago_confirmado = pagoConfirmado;
      }

      const response = await api.put(`/cocina/pedidos/${pedidoId}/estado/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el pedido #${pedidoId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la lista simple de productos mapeados para el formulario de almacén.
   * Filtra las categorías para extraer únicamente productos físicos (no preparados).
   */
  obtenerProductosSimple: async () => {
    try {
      const response = await api.get('/menu/');
      
      // Aplanamos el arreglo de categorías para obtener una lista directa de productos no preparados
      const productos = response.data.reduce((acc, categoria) => {
        const filtrados = (categoria.productos || []).filter(p => !p.es_preparado);
        return [...acc, ...filtrados];
      }, []); // <-- AQUÍ: le pones [] como valor inicial
      
      return productos;
    } catch (error) {
      console.error('Error al obtener productos para el almacén:', error);
      throw error;
    }
  },

  /**
   * Registra un nuevo lote de mercancía en el almacén de Django para el control PEPS
   * @param {number} productoId - ID del producto seleccionado
   * @param {number} cantidad - Unidades físicas que ingresan
   * @param {string} fechaCaducidad - Fecha de vencimiento en formato AAAA-MM-DD
   */
  registrarLote: async (productoId, cantidad, fechaCaducidad) => {
    try {
      const response = await api.post('/cocina/registrar-lote/', {
        producto_id: productoId,
        cantidad: cantidad,
        fecha_caducidad: fechaCaducidad
      });
      return response.data;
    } catch (error) {
      console.error('Error al registrar lote en almacén:', error);
      throw error;
    }
  },

  /**
   * Da de alta un producto que todavía no existe en el catálogo (ej. "Paletas" cuando solo había "Galletas").
   * categoriaNombre puede ser una categoría ya existente o una nueva: el backend la crea si no la encuentra.
   */
  crearProducto: async ({ nombre, descripcion, precio, categoriaNombre, esPreparado, stockMinimoAlerta }) => {
    try {
      const response = await api.post('/cocina/productos/crear/', {
        nombre,
        descripcion,
        precio,
        categoria_nombre: categoriaNombre,
        es_preparado: esPreparado,
        stock_minimo_alerta: stockMinimoAlerta,
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear producto nuevo:', error);
      throw error;
    }
  },

  /**
   * Lista las categorías ya existentes, para sugerirlas en el formulario de alta de productos.
   */
  obtenerCategorias: async () => {
    try {
      const response = await api.get('/cocina/categorias/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },

  /**
   * Obtiene el desglose financiero total del día actual para auditar la caja física
   */
  obtenerCierreCaja: async () => {
    try {
      const response = await api.get('/cocina/cierre-caja/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener el cierre de caja diario:', error);
      throw error;
    }
  }
};

export default cocinaService;
