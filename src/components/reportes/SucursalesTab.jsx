import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SucursalesTab({ data }) {
    if (!data) return <p className="text-gray-400 text-center py-8">Sin datos</p>;
    const { sucursales = [] } = data;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Recaudación por Sucursal</h4>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={sucursales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => `Bs. ${v}`} />
                        <Bar dataKey="total_recaudado" fill="#f59e0b" radius={[6,6,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200"><h4 className="font-semibold text-slate-900">Detalle de Sucursales</h4></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Sucursal</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Dirección</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Recaudado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Litros</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Ventas</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Turnos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sucursales.map(s => (
                                <tr key={s.sucursal_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-900 font-medium">{s.nombre}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{s.direccion}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded-full ${s.estado === 'ACTIVA' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{s.estado}</span></td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Bs. {s.total_recaudado}</td>
                                    <td className="px-4 py-3">{s.total_litros} Lt</td>
                                    <td className="px-4 py-3">{s.cantidad_ventas}</td>
                                    <td className="px-4 py-3">{s.cantidad_turnos}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
