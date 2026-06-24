import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Fuel, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { authService } from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState({ loading: false, message: '', error: '' });

  const handleResendVerification = async () => {
    if (!formData.email) {
      setResendStatus({ loading: false, message: '', error: 'Por favor, ingresa tu correo electrónico para reenviar la verificación.' });
      return;
    }
    
    setResendStatus({ loading: true, message: '', error: '' });
    try {
      await authService.resendVerification(formData.email);
      setResendStatus({ loading: false, message: 'Correo de verificación reenviado. Por favor, revisa tu bandeja de entrada.', error: '' });
    } catch (err) {
      setResendStatus({ 
        loading: false, 
        message: '', 
        error: err.response?.data?.error || 'Error al reenviar el correo. Intenta nuevamente.' 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({
          email: formData.email,
          password: formData.password
      });

      const user = response.user;

if (user?.is_superuser) {
    navigate('/superadmin');
    return;
}

const rol = (user?.roles_detalle?.[0]?.nombre || '').toLowerCase();

if (rol === 'administrador') {
    navigate('/admin');
} else if (rol === 'gerente') {
    navigate('/gerente');
} else if (rol === 'operador') {
    navigate('/ventas/turno');
} else if (rol === 'auditor') {
    navigate('/admin/bitacora');
} else if (rol === 'cliente') {
    navigate('/');
} else {
    navigate('/');
}
    } catch (err) {
        console.error('Error de inicio de sesión:', err);
        const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Credenciales incorrectas o error de conexión.';
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Acceso al Sistema</h2>
                <p className="text-gray-600">Ingrese sus credenciales para continuar</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {successMessage && (
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded">
                    {successMessage}
                  </div>
                )}
                {error && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded" aria-live="polite">
                    <p>{error}</p>
                    {error.toLowerCase().includes('verific') && (
                      <div className="mt-2">
                        <button 
                          type="button" 
                          onClick={handleResendVerification}
                          disabled={resendStatus.loading}
                          className="text-orange-600 hover:text-orange-700 font-semibold underline text-xs"
                        >
                          {resendStatus.loading ? 'Enviando...' : 'Reenviar correo de verificación'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {resendStatus.message && (
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-sm rounded" aria-live="polite">
                    {resendStatus.message}
                  </div>
                )}
                {resendStatus.error && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded" aria-live="polite">
                    {resendStatus.error}
                  </div>
                )}
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nombre@corporativo.bo"
                  label="CORREO ELECTRÓNICO"
                  required
                  icon={Mail}
                />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      CONTRASEÑA
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Olvidé mi contraseña
                    </button>
                  </div>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    icon={Lock}
                    showPasswordToggle
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Recordar sesión en esta terminal
                  </label>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  icon={ArrowRight}
                >
                  INICIAR SESIÓN
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600">
                  ¿Nuevo en el sistema corporativo?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="text-slate-900 font-bold hover:text-slate-700 inline-flex items-center space-x-1"
                  >
                    <span>Crear una cuenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </p>
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

export default LoginPage;
