import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState(() => {
    // Persistencia básica para que no se borre al recargar la página
    const guardado = localStorage.getItem('conalep_cart');
    return guardado ? JSON.parse(guardado) : [];
  });

  useEffect(() => {
    localStorage.setItem('conalep_cart', JSON.stringify(carrito));
  }, [carrito]);

  // Agregar un producto o aumentar su cantidad
  const agregarAlCarrito = (producto) => {
    setCarrito((prevCart) => {
      const existe = prevCart.find((item) => item.id === producto.id);

      if (existe) {
        // Validar stock disponible (si es preparado, el backend da 999 así que no hay problema)
        if (!producto.es_preparado && existe.cantidad >= producto.stock_disponible) {
          alert(`¡Huy bro! No puedes agregar más de este producto. Stock máximo: ${producto.stock_disponible}`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }

      // Si es el primer elemento, validar que al menos haya 1 en stock
      if (!producto.es_preparado && producto.stock_disponible <= 0) {
        alert('Este producto se encuentra agotado temporalmente.');
        return prevCart;
      }

      return [...prevCart, { ...producto, cantidad: 1 }];
    });
  };

  // Restar cantidad (-1)
  const restarCantidad = (productoId) => {
    setCarrito((prevCart) => {
      const existe = prevCart.find((item) => item.id === productoId);
      if (existe.cantidad === 1) {
        return prevCart.filter((item) => item.id !== productoId);
      }
      return prevCart.map((item) =>
        item.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item
      );
    });
  };

  // Remover por completo un producto del carrito
  const eliminarDelCarrito = (productoId) => {
    setCarrito((prevCart) => prevCart.filter((item) => item.id !== productoId));
  };

  // Limpiar todo el carrito (al cerrar sesión o terminar compra)
  const limpiarCarrito = () => {
    setCarrito([]);
  };

  // Totales dinámicos
  const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const montoTotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        restarCantidad,
        eliminarDelCarrito,
        limpiarCarrito,
        totalArticulos,
        montoTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
