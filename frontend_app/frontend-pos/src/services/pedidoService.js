import API from './api';

const pedidoService = {
  crearPedido: async (carritoItems, metodoPago = 'EFECTIVO') => {
    try {
      const payload = {
        metodo_pago: metodoPago,
        detalles: carritoItems.map((item) => ({
          producto: item.id,
          cantidad: item.cantidad,
        })),
      };

      // NOTA: Solo pones '/pedidos/crear/' porque Axios ya le pega la URL base antes de disparar
      const respuesta = await API.post('/pedidos/crear/', payload);
      // El backend regresa { mensaje, pedido: {...} }, no el pedido directo.
      // Regresamos ya el pedido "desenvuelto" para que quien lo use (ej. el ticket)
      // no tenga que acordarse de ese detalle.
      return respuesta.data.pedido;
    } catch (error) {
      const mensajeError = error.response?.data || { error: 'Ocurrió un error inesperado al procesar el pedido.' };
      console.error('Error al enviar el pedido a Django:', mensajeError);
      throw mensajeError;
    }
  },
};

export default pedidoService;
