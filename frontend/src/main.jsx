// main.jsx - UPDATED with HelmetProvider
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './All_Components/screen/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import PaymentModal from './All_Components/screen/PaymentModal';
import { PaymentModalProvider } from './context/PaymentModalContext';
import { PsychicAuthProvider } from './context/PsychicAuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <PsychicAuthProvider>
              <PaymentModalProvider>
                <App />
                <PaymentModal />
              </PaymentModalProvider>
            </PsychicAuthProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);