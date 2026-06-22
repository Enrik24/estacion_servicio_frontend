import { motion } from 'framer-motion';

/**
 * Tarjeta de indicador clave (KPI) con animación de entrada y micro-interacciones.
 * @param {Object} props
 * @param {string} props.title - Título del KPI
 * @param {string|number} props.value - Valor principal
 * @param {string} props.subtitle - Texto secundario bajo el valor
 * @param {React.ElementType} props.icon - Componente icono de Lucide
 * @param {string} props.color - Color de acento (emerald, blue, amber, violet, rose, cyan)
 * @param {number} props.index - Índice para escalonar la animación
 */
function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald', index = 0 }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
      ring: 'ring-emerald-500/20',
      glow: 'hover:shadow-emerald-500/10',
    },
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-500',
      ring: 'ring-blue-500/20',
      glow: 'hover:shadow-blue-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-500',
      ring: 'ring-amber-500/20',
      glow: 'hover:shadow-amber-500/10',
    },
    violet: {
      bg: 'bg-violet-500/10',
      icon: 'text-violet-500',
      ring: 'ring-violet-500/20',
      glow: 'hover:shadow-violet-500/10',
    },
    rose: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-500',
      ring: 'ring-rose-500/20',
      glow: 'hover:shadow-rose-500/10',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-500',
      ring: 'ring-cyan-500/20',
      glow: 'hover:shadow-cyan-500/10',
    },
  };

  const colors = colorMap[color] || colorMap.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      className={`relative bg-white rounded-2xl border border-gray-100 p-5 ring-1 ${colors.ring} shadow-sm hover:shadow-lg ${colors.glow} transition-all duration-300 group cursor-default overflow-hidden`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-2xl`} />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
          )}
        </div>

        <div className={`${colors.bg} p-2.5 rounded-xl`}>
          {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} />}
        </div>
      </div>
    </motion.div>
  );
}

export default KpiCard;
