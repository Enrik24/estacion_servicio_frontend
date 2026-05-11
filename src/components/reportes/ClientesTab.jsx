import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ClientesTab({ data }) {
    if (!data) return <p className="text-gray-400 text-center py-8">Sin datos</p>;
    const { ranking_clientes = [], uso_credito_fleet = [] } = data;

    return (
        <div className="space-y-6">
            {/* Ranking Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Top Clientes por Consumo</h4>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ranking_clientes} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="cliente_nombre" type="category" tick={{ fontSize: 11 }} width={150} />
                        <Tooltip formatter={(v) => `Bs. ${v}`} />
                        <Bar dataKey="total_consumido" fill="#8b5cf6" radius={[0,6,6,0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Ranking Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200"><h4 className="font-semibold text-slate-900">Ranking de Clientes</h4></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">NIT</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Consumido</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Litros</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Ventas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ranking_clientes.map((c, i) => (
                                <tr key={c.cliente_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-bold text-emerald-600">{i + 1}</td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">{c.cliente_nombre}</td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.cliente_nit}</td>
                                    <td className="px-4 py-3 font-semibold">Bs. {c.total_consumido}</td>
                                    <td className="px-4 py-3">{c.total_litros} Lt</td>
                                    <td className="px-4 py-3">{c.cantidad_ventas}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Crédito Fleet */}
            {uso_credito_fleet.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-200"><h4 className="font-semibold text-slate-900">Uso de Crédito Fleet</h4></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Crédito Usado</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {uso_credito_fleet.map(c => (
                                    <tr key={c.cliente_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-900 font-medium">{c.cliente_nombre}</td>
                                        <td className="px-4 py-3 font-semibold text-amber-600">Bs. {c.total_credito_usado}</td>
                                        <td className="px-4 py-3">{c.cantidad}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
