import { Calendar } from 'lucide-react';

/**
 * Filtro de rango de fechas con botones de preselección rápida.
 * @param {Object} props
 * @param {string} props.fechaInicio
 * @param {string} props.fechaFin
 * @param {Function} props.onFechaInicioChange
 * @param {Function} props.onFechaFinChange
 * @param {Function} props.onQuickFilter - Callback para filtros rápidos (hoy, semana, mes)
 */
function DateRangeFilter({ fechaInicio, fechaFin, onFechaInicioChange, onFechaFinChange, onQuickFilter }) {
  const quickFilters = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Esta Semana', value: 'semana' },
    { label: 'Este Mes', value: 'mes' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Botones de filtro rápido */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {quickFilters.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onQuickFilter(value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 text-gray-500 hover:text-slate-900 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Inputs de fecha personalizados */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => onFechaInicioChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition text-gray-700"
          />
        </div>
        <span className="text-gray-300 text-xs font-medium">—</span>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => onFechaFinChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}

export default DateRangeFilter;
