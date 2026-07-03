import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TurnosTab({ data }) {
    if (!data) return <p className="text-gray-400 text-center py-8">Sin datos</p>;
    const { turnos = [], por_horario = [] } = data;

    return (
        <div className="space-y-6">
            {/* Por Horario Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Recaudación por Horario</h4>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={por_horario}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="horario" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => `Bs. ${v}`} />
                        <Bar dataKey="total_recaudado" fill="#3b82f6" radius={[6,6,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Turnos Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200"><h4 className="font-semibold text-slate-900">Detalle de Turnos</h4></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Operador</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Isla</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Horario</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Recaudado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Litros</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Ventas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {turnos.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No hay turnos</td></tr>
                            ) : turnos.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600">#{t.id}</td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">{t.operador}</td>
                                    <td className="px-4 py-3">Isla {t.isla}</td>
                                    <td className="px-4 py-3 text-xs">{t.horario}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded-full ${t.estado === 'CERRADO' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>{t.estado}</span></td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Bs. {t.total_recaudado}</td>
                                    <td className="px-4 py-3">{t.total_litros} Lt</td>
                                    <td className="px-4 py-3">{t.cantidad_ventas}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
