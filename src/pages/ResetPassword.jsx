import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, Fuel, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { authService } from '../services/api';

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Enlace de recuperación no válido o inexistente.');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token de recuperación no válido.');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.resetPassword(token, formData.password);
      setMessage(response.data?.mensaje || 'Contraseña actualizada correctamente. Redirigiendo...');
      setFormData({ password: '', confirmPassword: '' }); // Limpiar campos sensibles
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'El enlace de recuperación es inválido, ha expirado, o ocurrió un error.');
    } finally {
      setLoading(false);
    }
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
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Nueva Contraseña</h2>
                <p className="text-gray-600">Por favor, ingresa tu nueva contraseña a continuación.</p>
              </div>

              {message && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm flex items-center" aria-live="polite">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {message}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm" aria-live="polite">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  label="NUEVA CONTRASEÑA"
                  required
                  minLength={8}
                  icon={Lock}
                  showPasswordToggle
                />
                
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  label="CONFIRMAR CONTRASEÑA"
                  required
                  minLength={8}
                  icon={Lock}
                  showPasswordToggle
                />

                <Button
                  type="submit"
                  loading={loading}
                  icon={ArrowRight}
                >
                  CAMBIAR CONTRASEÑA
                </Button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <Link to="/login" className="text-slate-900 font-bold hover:text-slate-700 inline-flex items-center space-x-1">
                  Volver al inicio de sesión
                </Link>
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

export default ResetPassword;
