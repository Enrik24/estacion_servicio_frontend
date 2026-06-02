import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function IslasTab({ data }) {
    if (!data) return <p className="text-gray-400 text-center py-8">Sin datos</p>;
    const { islas = [], isla_top } = data;

    return (
        <div className="space-y-6">
            {isla_top && (
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-md">
                    <p className="text-sm opacity-90">Isla con Mayor Recaudación</p>
                    <p className="text-3xl font-bold mt-1">Isla {isla_top.numero} — Bs. {isla_top.total_recaudado}</p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Recaudación por Isla</h4>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={islas}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="numero" tickFormatter={(v) => `Isla ${v}`} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => `Bs. ${v}`} labelFormatter={(v) => `Isla ${v}`} />
                        <Bar dataKey="total_recaudado" radius={[6,6,0,0]}>
                            {islas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {islas.map(isla => (
                <div key={isla.isla_id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h4 className="font-semibold text-slate-900">Isla {isla.numero} — {isla.sucursal}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isla.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{isla.estado}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-5">
                        <div><p className="text-xs text-gray-500 uppercase font-semibold">Recaudado</p><p className="text-lg font-bold text-emerald-600">Bs. {isla.total_recaudado}</p></div>
                        <div><p className="text-xs text-gray-500 uppercase font-semibold">Litros</p><p className="text-lg font-bold text-blue-600">{isla.total_litros} Lt</p></div>
                        <div><p className="text-xs text-gray-500 uppercase font-semibold">Ventas</p><p className="text-lg font-bold text-slate-900">{isla.cantidad_ventas}</p></div>
                    </div>
                    {isla.lados && isla.lados.length > 0 && (
                        <div className="px-5 pb-5">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left font-semibold text-gray-700">Lado</th><th className="px-3 py-2 text-left font-semibold text-gray-700">Activo</th><th className="px-3 py-2 text-left font-semibold text-gray-700">Recaudado</th><th className="px-3 py-2 text-left font-semibold text-gray-700">Litros</th><th className="px-3 py-2 text-left font-semibold text-gray-700">Ventas</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isla.lados.map(l => (
                                        <tr key={l.lado} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 font-medium">Lado {l.lado}</td>
                                            <td className="px-3 py-2">{l.activo ? '✓' : '✗'}</td>
                                            <td className="px-3 py-2 font-semibold text-emerald-600">Bs. {l.total_recaudado}</td>
                                            <td className="px-3 py-2">{l.total_litros} Lt</td>
                                            <td className="px-3 py-2">{l.cantidad_ventas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
