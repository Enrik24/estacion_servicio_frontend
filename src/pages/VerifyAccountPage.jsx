import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, LoaderCircle } from 'lucide-react';
import { authService } from '../services/api';
import Button from '../components/ui/Button';

function VerifyAccountPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Estamos verificando tu cuenta...');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const response = await authService.verifyAccount(token);
        if (!active) return;
        setStatus('success');
        setMessage(response.data?.mensaje || 'Cuenta verificada correctamente.');
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(
          error.response?.data?.error ||
            'No se pudo verificar la cuenta. Solicita un nuevo enlace e inténtalo otra vez.'
        );
      }
    };

    if (!token) {
      setStatus('error');
      setMessage('El enlace de verificación es inválido.');
      return undefined;
    }

    verify();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-8 text-center space-y-5">
        <div className="flex justify-center">
          {status === 'loading' && <LoaderCircle className="w-12 h-12 animate-spin text-blue-600" />}
          {status === 'success' && <CheckCircle2 className="w-12 h-12 text-emerald-600" />}
          {status === 'error' && <AlertTriangle className="w-12 h-12 text-amber-500" />}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {status === 'success' ? 'Cuenta verificada' : status === 'error' ? 'Verificación fallida' : 'Verificando cuenta'}
          </h1>
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        <Button onClick={() => navigate('/login')}>
          Ir a iniciar sesión
        </Button>
      </div>
    </div>
  );
}

export default VerifyAccountPage;
