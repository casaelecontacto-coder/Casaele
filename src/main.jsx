import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css";
import App from './App.jsx'
import "@fortawesome/fontawesome-free/css/all.min.css";
import { CartProvider } from './context/CartContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Wrap the <App /> with <CartProvider> */}
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>,
)