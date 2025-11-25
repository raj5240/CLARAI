import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const clientId =
  (typeof import.meta !== "undefined" ? (import.meta as Record<string, any>)?.env?.VITE_GOOGLE_CLIENT_ID : undefined) ||
  (globalThis as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID;
if (!clientId) {
  console.warn("VITE_GOOGLE_CLIENT_ID is not defined. Google Sign-In will be disabled.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId ?? ''}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);