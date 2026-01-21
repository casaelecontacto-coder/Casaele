import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';

createRoot(document.getElementById('root')).render(
<StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </CurrencyProvider>
    </LanguageProvider>
  </StrictMode>
)