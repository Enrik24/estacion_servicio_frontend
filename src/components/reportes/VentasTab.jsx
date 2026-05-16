import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function VentasTab({ data }) {
    if (!data) return <p className="text-gray-400 text-center py-8">Sin datos</p>;
    const { resumen, por_combustible = [], por_metodo_pago = [], por_estado = [] } = data;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Recaudado</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Bs. {resumen?.total_recaudado || '0'}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Litros</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{resumen?.total_litros || '0'} Lt</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Cantidad de Ventas</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{resumen?.cantidad_ventas || 0}</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Por Combustible */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h4 className="font-semibold text-slate-900 mb-4">Recaudación por Combustible</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={por_combustible}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="tipo_combustible" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => `Bs. ${v}`} />
                            <Bar dataKey="total_recaudado" fill="#10b981" radius={[6,6,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Por Método de Pago */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h4 className="font-semibold text-slate-900 mb-4">Distribución por Método de Pago</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={por_metodo_pago} dataKey="total_recaudado" nameKey="metodo_pago" cx="50%" cy="50%" outerRadius={100} label={({ metodo_pago, percent }) => `${metodo_pago} ${(percent*100).toFixed(0)}%`}>
                                {por_metodo_pago.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => `Bs. ${v}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Por Estado Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200"><h4 className="font-semibold text-slate-900">Ventas por Estado</h4></div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-5 py-3 text-left font-semibold text-gray-700">Estado</th><th className="px-5 py-3 text-left font-semibold text-gray-700">Cantidad</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {por_estado.map((e, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-5 py-3"><span className={`px-2 py-1 text-xs font-medium rounded-full ${e.estado === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{e.estado}</span></td>
                                <td className="px-5 py-3 text-gray-900">{e.cantidad}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
