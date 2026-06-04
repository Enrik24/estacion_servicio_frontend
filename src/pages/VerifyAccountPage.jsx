import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Fuel, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { authService } from '../services/api';

function VerifyAccountPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verificando tu cuenta...');
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificación no válido o inexistente.');
        return;
      }

      try {
        const response = await authService.verifyAccount(token);
        setStatus('success');
        setMessage(response.data?.mensaje || 'Cuenta verificada correctamente. Ya puedes iniciar sesión.');
        setTimeout(() => {
          navigate('/login', { state: { message: 'Cuenta verificada correctamente. Ya puedes iniciar sesión.' } });
        }, 4000);
      } catch (err) {
        setStatus('error');
        console.error('Error verificando cuenta:', err);
        setMessage(err.response?.data?.error || err.response?.data?.detail || 'El enlace de verificación es inválido o ha expirado.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-5">
        <img
          src="https://placehold.co/1920x1080/1e293b/64748b?text=Industrial+Background"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl w-full grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 text-white space-y-8"
          >
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                <span className="text-white">Surtidor</span>
                <span className="text-emerald-400">Bolivia</span>
              </h1>
              <div className="h-1 w-24 bg-orange-500 rounded-full"></div>
            </div>

            <p className="text-lg text-gray-300 leading-relaxed">
              Tu plataforma digital para la gestión eficiente de combustible. Compra anticipada, consulta de saldos e historial de consumos en un solo lugar.
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 bg-slate-800/50 p-4 rounded-lg border-l-4 border-orange-500">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Fuel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">SERVICIOS</p>
                  <p className="text-white font-semibold">Combustibles</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-slate-800/50 p-4 rounded-lg border-l-4 border-green-500">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">ACCESO</p>
                  <p className="text-white font-semibold">Seguro</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card>
              <div className="text-center py-8">
                {status === 'loading' && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Verificando cuenta</h2>
                    <p className="text-gray-600">{message}</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Cuenta Verificada!</h2>
                    <p className="text-gray-600 mb-8">{message}</p>
                    <Button 
                      onClick={() => navigate('/login')}
                      icon={ArrowRight}
                    >
                      IR AL INICIO DE SESIÓN
                    </Button>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                      <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Error de Verificación</h2>
                    <p className="text-gray-600 mb-8">{message}</p>
                    <div className="space-x-4">
                      <Button 
                        onClick={() => navigate('/login')}
                        variant="outline"
                      >
                        VOLVER AL LOGIN
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <footer className="relative z-10 py-6 text-center text-gray-400 text-sm bg-slate-900/50">
        <p className="mb-2">© 2024 YPFB CORPORATIVO</p>
        <div className="flex justify-center space-x-6">
          <a href="#" className="hover:text-orange-500 transition">TÉRMINOS</a>
          <a href="#" className="hover:text-orange-500 transition">PRIVACIDAD</a>
          <a href="#" className="hover:text-orange-500 transition">SOPORTE IT</a>
        </div>
      </footer>
    </div>
  );
}

export default VerifyAccountPage;
