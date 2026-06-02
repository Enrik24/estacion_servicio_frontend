import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import OneSignal from 'react-onesignal';

OneSignal.init({
    appId: 'c1ec0c61-fb3a-4c87-8667-1107a403ed11',
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerParam: { scope: '/' },
}).then(() => {
    console.log('OneSignal inicializado correctamente');
}).catch(e => {
    console.log('Error inicializando OneSignal:', e);
});
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
