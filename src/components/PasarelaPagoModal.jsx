import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

function QRCode({ monto }) {
  const qrData = `PAGO:${monto}:ESTACION_BOLIVIA:${Date.now()}`;
  const size = 160;
  const cells = 21;
  const cellSize = size / cells;

  const pattern = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if ((r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)) return 1;
      const hash = (qrData.charCodeAt((r * cells + c) % qrData.length) + r + c) % 3;
      return hash === 0 ? 1 : 0;
    })
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pattern.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#000"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function PasarelaPagoModal({ metodo, monto, onConfirmar, onCancelar }) {
  const [estado, setEstado] = useState('esperando');
  const [progreso, setProgreso] = useState(0);
  const tiempoEspera = metodo === 'QR' ? 6000 : 3000;

  useEffect(() => {
    if (estado !== 'esperando') return;

    const intervalo = setInterval(() => {
      setProgreso(p => {
        const nuevo = p + (100 / (tiempoEspera / 100));
        if (nuevo >= 100) {
          clearInterval(intervalo);
          setEstado('procesando');
          setTimeout(() => setEstado('aprobado'), 800);
        }
        return nuevo;
      });
    }, 100);

    return () => clearInterval(intervalo);
  }, [estado]);

  useEffect(() => {
    if (estado === 'aprobado') {
      setTimeout(() => onConfirmar(), 1200);
    }
  }, [estado]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className={`p-4 text-center text-white font-semibold text-sm ${
          metodo === 'QR' ? 'bg-blue-600' : 'bg-slate-700'
        }`}>
          {metodo === 'QR' ? '📱 Pago mediante QR' : '💳 Pago con Tarjeta'}
        </div>

        <div className="p-6">

          {/* QR */}
          {metodo === 'QR' && estado === 'esperando' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500 text-center">
                El cliente debe escanear el código QR con su app bancaria
              </p>
              <div className="border-4 border-blue-600 rounded-xl p-3">
                <QRCode monto={monto} />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Monto a cobrar</p>
                <p className="text-2xl font-bold text-slate-900">Bs. {monto}</p>
              </div>
              <p className="text-xs text-blue-500 animate-pulse">
                Esperando confirmación del banco...
              </p>
            </div>
          )}

          {/* TARJETA */}
          {metodo === 'TARJETA' && estado === 'esperando' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">💳</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">Procesando en POS</p>
                <p className="text-xs text-gray-500 mt-1">
                  Pida al cliente que acerque o inserte su tarjeta
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Monto a cobrar</p>
                <p className="text-2xl font-bold text-slate-900">Bs. {monto}</p>
              </div>
              <p className="text-xs text-slate-500 animate-pulse">
                Comunicando con el banco...
              </p>
            </div>
          )}

          {/* PROCESANDO */}
          {estado === 'procesando' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Procesando pago...</p>
            </div>
          )}

          {/* APROBADO */}
          {estado === 'aprobado' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-16 h-16 text-emerald-500" />
              <p className="text-lg font-bold text-emerald-600">¡Pago aprobado!</p>
              <p className="text-sm text-gray-500">Registrando venta...</p>
            </div>
          )}

          {/* BARRA DE PROGRESO */}
          {estado === 'esperando' && (
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    metodo === 'QR' ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )}

          {/* BOTÓN CANCELAR */}
          {estado === 'esperando' && (
            <button
              onClick={onCancelar}
              className="mt-4 w-full text-sm text-gray-400 hover:text-red-500 transition py-2"
            >
              Cancelar pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
}