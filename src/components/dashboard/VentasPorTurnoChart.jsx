import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

const COLORS_TURNO = {
  'Mañana': '#10b981',  // emerald
  'Tarde': '#3b82f6',   // blue
  'Noche': '#8b5cf6',   // violet
};

/**
 * Tooltip personalizado para el gráfico de turnos.
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
          <span className="font-bold">{Number(entry.value).toLocaleString('es-BO')}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Gráfico de ventas por turno (Mañana, Tarde, Noche).
 * @param {Object} props
 * @param {Array} props.data - Array con { turno, litros, monto }
 */
function VentasPorTurnoChart({ data = [] }) {
  const chartData = data.map(item => {
    let turnoMapped = item.turno || 'N/A';
    if (turnoMapped === 'MANANA') turnoMapped = 'Mañana';
    if (turnoMapped === 'TARDE') turnoMapped = 'Tarde';
    if (turnoMapped === 'NOCHE') turnoMapped = 'Noche';
    
    return {
      ...item,
      turno: turnoMapped,
      monto: Number(item.total_bs || 0)
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
    >
      <h3 className="text-sm font-bold text-slate-800 mb-1">Ventas por Turno</h3>
      <p className="text-xs text-gray-400 mb-4">Litros despachados y monto (Bs) por turno</p>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-gray-300 text-sm">
          Sin datos de turnos para este periodo
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="turno"
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toLocaleString('es-BO')}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }}
            />
            <Bar dataKey="litros" name="Litros" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS_TURNO[entry.turno] || '#94a3b8'} fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="monto" name="Monto (Bs)" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS_TURNO[entry.turno] || '#94a3b8'} fillOpacity={0.45} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

export default VentasPorTurnoChart;
