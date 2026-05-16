import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, CircleCheck as CheckCircle, Fuel, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { authService } from '../services/api';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptPrivacyPolicy: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Ingrese un correo electrónico válido';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.acceptPrivacyPolicy) {
      newErrors.acceptPrivacyPolicy = 'Debes aceptar la política de privacidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Mapeo de campos: fullName -> nombre
      const payload = {
        nombre: formData.fullName,
        email: formData.email,
        password: formData.password,
        password_confirmacion: formData.confirmPassword,
        acepta_politica_privacidad: formData.acceptPrivacyPolicy
      };

      const response = await authService.register(payload);
      
      navigate('/login', { 
        state: { message: response.data?.mensaje || 'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.' } 
      });
    } catch (error) {
      console.error('Error en registro:', error);
      
      const serverError = error.response?.data?.error || 'Error al procesar el registro. Intente de nuevo.';
      setErrors(prev => ({
        ...prev,
        submit: serverError
      }));
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

      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
        }}></div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-xl mb-4">
              <Fuel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white uppercase tracking-wide mb-2">
              SURTIDORBOLIVIA
            </h1>
            <p className="text-sm text-gray-400 uppercase tracking-widest">
              LIDER EN SISTEMAS DE SURTIDORES
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-4 border-orange-500">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Registro de Usuario</h2>
              <p className="text-sm text-gray-600">Ingrese sus credenciales.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.submit && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                  {errors.submit}
                </div>
              )}
              <Input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                label="NOMBRE COMPLETO"
                required
                icon={User}
                variant="filled"
                error={errors.fullName}
              />

              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nombre@correo.com"
                label="CORREO ELECTRÓNICO"
                required
                icon={Mail}
                variant="filled"
                error={errors.email}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  label="CONTRASEÑA"
                  required
                  icon={Lock}
                  variant="filled"
                  error={errors.password}
                />

                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  label="CONFIRMAR"
                  required
                  icon={CheckCircle}
                  variant="filled"
                  error={errors.confirmPassword}
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="acceptPrivacyPolicy"
                  checked={formData.acceptPrivacyPolicy}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  Acepto el tratamiento de mis datos para crear, verificar y auditar mi cuenta.
                </span>
              </label>
              {errors.acceptPrivacyPolicy && (
                <div className="text-red-600 text-sm">
                  {errors.acceptPrivacyPolicy}
                </div>
              )}
              <Button
                type="submit"
                loading={loading}
                icon={ArrowRight}
                shadow
              >
                CREAR CUENTA
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tiene acceso al sistema?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-slate-900 font-bold hover:underline"
                >
                  Ya tengo una cuenta
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="relative z-10 py-6 text-center">
        <div className="flex justify-between items-center max-w-md mx-auto px-4">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>NODO CENTRAL BOLIVIA OPERATIVO</span>
          </div>
          <div className="text-xs text-gray-500">
            V4.2.0-STABLE
          </div>
        </div>
        <div className="flex justify-end max-w-md mx-auto px-4 mt-2 space-x-1">
          <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
          <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
          <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
        </div>
      </footer>
    </div>
  );
}

export default RegisterPage;
