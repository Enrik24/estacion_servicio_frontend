import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG = {
  activos: {
    label: 'Activos',
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconColor: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  inactivos: {
    label: 'Inactivos',
    icon: XCircle,
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    iconColor: 'text-gray-400',
    dot: 'bg-gray-400',
  },
  en_falla: {
    label: 'En Falla',
    icon: AlertTriangle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconColor: 'text-red-500',
    dot: 'bg-red-500',
  },
};

/**
 * Widget de estado operativo de surtidores.
 * Muestra indicadores de color con cantidad para cada estado.
 * @param {Object} props
 * @param {Object} props.data - Objeto con { activos, inactivos, en_falla }
 */
function EstadoSurtidoresWidget({ data = {} }) {
  const activos = data.ACTIVO || 0;
  const inactivos = data.INACTIVO || 0;
  const en_falla = data.FALLA || 0;
  const total = activos + inactivos + en_falla;
  const pctActivos = total > 0 ? (activos / total) * 100 : 0;
  
  const mappedData = { activos, inactivos, en_falla };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
    >
      <h3 className="text-sm font-bold text-slate-800 mb-1">Estado Operativo de Surtidores</h3>
      <p className="text-xs text-gray-400 mb-4">Resumen del estado actual de las islas</p>

      {total === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
          Sin datos de estado
        </div>
      ) : (
        <>
          {/* Barra de progreso apilada */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex mb-5">
            {mappedData.activos > 0 && (
              <div
                className="bg-emerald-500 transition-all duration-700"
                style={{ width: `${(mappedData.activos / total) * 100}%` }}
              />
            )}
            {mappedData.inactivos > 0 && (
              <div
                className="bg-gray-300 transition-all duration-700"
                style={{ width: `${(mappedData.inactivos / total) * 100}%` }}
              />
            )}
            {mappedData.en_falla > 0 && (
              <div
                className="bg-red-500 transition-all duration-700"
                style={{ width: `${(mappedData.en_falla / total) * 100}%` }}
              />
            )}
          </div>

          {/* Cards de estado */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const count = mappedData[key] || 0;
              return (
                <div
                  key={key}
                  className={`${config.bg} border ${config.border} rounded-xl p-3 text-center transition-all duration-200 hover:scale-[1.02]`}
                >
                  <Icon className={`w-5 h-5 ${config.iconColor} mx-auto mb-1.5`} />
                  <p className={`text-xl font-black ${config.text}`}>{count}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                    {config.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Disponibilidad */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Disponibilidad operativa:{' '}
              <span className={`font-bold ${pctActivos >= 80 ? 'text-emerald-600' : pctActivos >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {pctActivos.toFixed(1)}%
              </span>
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default EstadoSurtidoresWidget;
