import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const BAR_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

/**
 * Tooltip personalizado.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs">
      <p className="font-bold text-sm mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-bold">{Number(entry.value).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Gráfico de barras horizontales para rendimiento por surtidor.
 * @param {Object} props
 * @param {Array} props.data - Array con { nombre, litros_despachados }
 */
function RendimientoSurtidoresChart({ data = [] }) {
  const chartData = data.map(item => ({
    nombre: item.surtidor || `Surtidor ${item.isla_id || '?'}`,
    litros: Number(item.litros || 0),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
    >
      <h3 className="text-sm font-bold text-slate-800 mb-1">Rendimiento por Surtidor</h3>
      <p className="text-xs text-gray-400 mb-4">Litros despachados por isla/lado</p>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-gray-300 text-sm">
          Sin datos de surtidores para este periodo
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 48)}>
          <BarChart data={chartData} layout="vertical" barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toLocaleString('es-BO')}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={120}
              tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
            <Bar dataKey="litros" name="Litros" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

export default RendimientoSurtidoresChart;
