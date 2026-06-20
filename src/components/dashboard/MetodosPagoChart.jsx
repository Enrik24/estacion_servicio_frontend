import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const LABEL_MAP = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  qr: 'QR',
  credito: 'Crédito',
  transferencia: 'Transferencia',
};

/**
 * Tooltip personalizado para el donut chart.
 */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs">
      <p className="font-bold text-sm">{entry.name}</p>
      <p className="text-gray-300 mt-1">
        Monto: <span className="font-bold text-white">Bs. {Number(entry.value).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
      </p>
      <p className="text-gray-300">
        Porcentaje: <span className="font-bold text-emerald-400">{(entry.payload.porcentaje || 0).toFixed(1)}%</span>
      </p>
    </div>
  );
}

/**
 * Renderiza etiquetas personalizadas dentro del donut.
 */
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, porcentaje }) {
  if (porcentaje < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {porcentaje.toFixed(0)}%
    </text>
  );
}

/**
 * Gráfico de dona para métodos de pago.
 * @param {Object} props
 * @param {Array} props.data - Array con { metodo, total }
 */
function MetodosPagoChart({ data = [] }) {
  const total = data.reduce((acc, item) => acc + Number(item.total_bs || 0), 0);

  const chartData = data.map(item => ({
    name: LABEL_MAP[item.metodo?.toLowerCase()] || item.metodo || 'Otro',
    value: Number(item.total_bs || 0),
    porcentaje: Number(item.porcentaje || 0),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
    >
      <h3 className="text-sm font-bold text-slate-800 mb-1">Métodos de Pago</h3>
      <p className="text-xs text-gray-400 mb-4">Distribución por medio de pago</p>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-gray-300 text-sm">
          Sin datos de pagos para este periodo
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
              animationBegin={200}
              animationDuration={800}
            >
              {chartData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={COLORS[idx % COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* Total central visible */}
      {chartData.length > 0 && (
        <div className="text-center -mt-2">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-lg font-black text-slate-900">
            Bs. {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default MetodosPagoChart;
