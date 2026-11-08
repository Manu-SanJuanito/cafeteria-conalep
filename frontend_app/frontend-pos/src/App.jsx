import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/Navbar'; 
import { CartProvider } from './contexts/CartContext';

function App() {
  return (
    <Router>
      <CartProvider> {/* <--- 2. Envolvemos todo el contenedor */}
        <div className="app-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          {/* Tu barra institucional fija */}
          <Navbar /> 
          
          <main>
            <AppRoutes />
          </main>
        </div>
      </CartProvider> {/* <--- 3. Cerramos el proveedor */}
    </Router>
  );
}

export default App;
