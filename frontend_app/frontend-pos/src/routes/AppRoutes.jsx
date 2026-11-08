import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuView from '../pages/public/MenuView';
import LoginView from '../pages/alumno/LoginView';
import AlertasStockView from '../pages/cocina/AlertasStockView';
import CartView from '../pages/alumno/CartView'; 
import TicketView from '../pages/alumno/TicketView';

// Vistas administrativas
import GestionPedidosView from '../pages/cocina/GestionPedidosView';
import RegistrarLoteView from '../pages/cocina/RegistrarLoteView'; // <-- Asegúrate de que la ruta del archivo sea correcta
import CierreCajaView from '../pages/cocina/CierreCajaView';       // <-- Asegúrate de que la ruta del archivo sea correcta
import CrearProductoView from '../pages/cocina/CrearProductoView';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas y de alumnos */}
      <Route path="/menu" element={<MenuView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/carrito" element={<CartView />} />
      <Route path="/ticket" element={<TicketView />} />
      
      {/* Rutas del panel de cocina / caja */}
      <Route path="/cocina/pedidos" element={<GestionPedidosView />} />
      <Route path="/cocina/alertas" element={<AlertasStockView />} />
      <Route path="/cocina/almacen" element={<RegistrarLoteView />} /> {/* Módulo de Lotes */}
      <Route path="/cocina/productos/nuevo" element={<CrearProductoView />} /> {/* 🆕 Alta de productos nuevos */}
      <Route path="/cocina/cierre" element={<CierreCajaView />} />     {/* Módulo de Cierre */}
      
      {/* Redirección por defecto si no encuentra la URL */}
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
};

export default AppRoutes;
