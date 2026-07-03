import { useEffect, useState } from 'react';
import { Award, Settings, TrendingUp, Plus, Minus, X, Search } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { puntosService } from '../../services/puntosService';

const CONFIG_INICIAL = {
    activo: true,
    puntos_por_litro: '1',
    valor_punto_bs: '0.10',
    minimo_canje: '100',
};

const AJUSTE_INICIAL = { puntos: '', motivo: '', signo: '+' };

function formatearBs(valor) {
    const numero = Number(valor || 0);
    return `Bs ${numero.toFixed(2)}`;
}

function PuntosModule() {
    const [config, setConfig] = useState(CONFIG_INICIAL);
    const [configOriginal, setConfigOriginal] = useState(CONFIG_INICIAL);
    const [ranking, setRanking] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(false);
    const [guardandoConfig, setGuardandoConfig] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    const [clienteSel, setClienteSel] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [ajuste, setAjuste] = useState(AJUSTE_INICIAL);
    const [aplicandoAjuste, setAplicandoAjuste] = useState(false);

    useEffect(() => {
        cargar();
    }, []);

    const cargar = async () => {
        setLoading(true);
        setError(null);
        try {
            const [cfgRes, rankRes] = await Promise.all([
                puntosService.getConfig(),
                puntosService.getRanking(),
            ]);
            const cfg = {
                activo: cfgRes.data.activo,
                puntos_por_litro: String(cfgRes.data.puntos_por_litro),
                valor_punto_bs: String(cfgRes.data.valor_punto_bs),
                minimo_canje: String(cfgRes.data.minimo_canje),
            };
            setConfig(cfg);
            setConfigOriginal(cfg);
            setRanking(rankRes.data.clientes || []);
        } catch (e) {
            setError(e.response?.data?.error || 'Error al cargar datos de puntos');
        } finally {
            setLoading(false);
        }
    };

    const guardarConfig = async (e) => {
        e.preventDefault();
        setGuardandoConfig(true);
        setError(null);
        setMensaje(null);
        try {
            await puntosService.guardarConfig({
                activo: config.activo,
                puntos_por_litro: config.puntos_por_litro,
                valor_punto_bs: config.valor_punto_bs,
                minimo_canje: parseInt(config.minimo_canje, 10),
            });
            setConfigOriginal(config);
            setMensaje('Configuración actualizada');
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo guardar la configuración');
        } finally {
            setGuardandoConfig(false);
        }
    };

    const abrirDetalle = async (cliente) => {
        setClienteSel(cliente);
        setDetalle(null);
        setAjuste(AJUSTE_INICIAL);
        setLoadingDetalle(true);
        try {
            const res = await puntosService.getMovimientos(cliente.id);
            setDetalle(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'Error al cargar movimientos');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const cerrarDetalle = () => {
        setClienteSel(null);
        setDetalle(null);
        setAjuste(AJUSTE_INICIAL);
    };

    const aplicarAjuste = async (e) => {
        e.preventDefault();
        setAplicandoAjuste(true);
        setError(null);
        try {
            const puntos = parseInt(ajuste.puntos, 10);
            if (!puntos || puntos <= 0) {
                setError('Ingresa una cantidad de puntos válida');
                setAplicandoAjuste(false);
                return;
            }
            const delta = ajuste.signo === '-' ? -puntos : puntos;
            await puntosService.ajustar(clienteSel.id, {
                puntos: delta,
                motivo: ajuste.motivo,
            });
            // Recarga detalle + ranking
            const [detRes] = await Promise.all([
                puntosService.getMovimientos(clienteSel.id),
                cargar(),
            ]);
            setDetalle(detRes.data);
            setAjuste(AJUSTE_INICIAL);
            setMensaje(`Ajuste aplicado a ${clienteSel.nombre}`);
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo aplicar el ajuste');
        } finally {
            setAplicandoAjuste(false);
        }
    };

    const rankingFiltrado = ranking.filter((c) => {
        if (!busqueda) return true;
        const q = busqueda.toLowerCase();
        return (
            (c.nombre || '').toLowerCase().includes(q) ||
            (c.nit || '').toLowerCase().includes(q)
        );
    });

    const cambios = JSON.stringify(config) !== JSON.stringify(configOriginal);
    const totalClientes = ranking.length;
    const totalPuntos = ranking.reduce((acc, c) => acc + (c.puntos_acumulados || 0), 0);
    const clientesConPuntos = ranking.filter((c) => c.puntos_acumulados > 0).length;

    const badgeColor = (tipo) => {
        switch (tipo) {
            case 'ACUMULACION': return 'bg-emerald-100 text-emerald-700';
            case 'CANJE': return 'bg-blue-100 text-blue-700';
            case 'AJUSTE': return 'bg-amber-100 text-amber-700';
            case 'REVERSA': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-6 h-6 text-amber-500" />
                        Programa de Puntos
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Configura las reglas y consulta el saldo de cada cliente
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                </div>
            )}
            {mensaje && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm">
                    {mensaje}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Clientes registrados</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalClientes}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Con puntos activos</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{clientesConPuntos}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total puntos otorgados</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{totalPuntos.toLocaleString()}</p>
                </div>
            </div>

            {/* Configuración */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-slate-500" />
                    <h2 className="text-lg font-bold text-slate-900">Reglas del programa</h2>
                </div>
                <form onSubmit={guardarConfig} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={config.activo}
                                onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                                className="w-4 h-4"
                            />
                            Programa activo (si se desactiva, no se acumulan ni canjean puntos)
                        </label>
                    </div>
                    <Input
                        label="Puntos por litro"
                        type="number"
                        step="0.01"
                        min="0"
                        value={config.puntos_por_litro}
                        onChange={(e) => setConfig({ ...config, puntos_por_litro: e.target.value })}
                        required
                    />
                    <Input
                        label="Valor por punto (Bs)"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={config.valor_punto_bs}
                        onChange={(e) => setConfig({ ...config, valor_punto_bs: e.target.value })}
                        required
                    />
                    <Input
                        label="Mínimo para canje (pts)"
                        type="number"
                        step="1"
                        min="1"
                        value={config.minimo_canje}
                        onChange={(e) => setConfig({ ...config, minimo_canje: e.target.value })}
                        required
                    />
                    <div className="flex items-end">
                        <Button
                            type="submit"
                            loading={guardandoConfig}
                            disabled={!cambios}
                            fullWidth={false}
                            size="small"
                        >
                            Guardar
                        </Button>
                    </div>
                </form>
                <p className="text-xs text-gray-400 mt-3">
                    Ejemplo: con {config.puntos_por_litro || 0} pts/Lt y valor Bs {config.valor_punto_bs || 0} por punto,
                    un cliente que carga 100 Lt gana {Math.floor((config.puntos_por_litro || 0) * 100)} pts,
                    que valen {formatearBs((config.valor_punto_bs || 0) * (config.puntos_por_litro || 0) * 100)}.
                </p>
            </div>

            {/* Ranking */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-bold text-slate-900">Puntos por cliente</h2>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o NIT..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-64"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Cargando...</div>
                ) : rankingFiltrado.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Sin clientes que mostrar</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NIT</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor Bs</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingFiltrado.map((c, idx) => {
                                    const valor = (c.puntos_acumulados || 0) * Number(config.valor_punto_bs || 0);
                                    return (
                                        <tr key={c.id} className="border-b border-gray-100 hover:bg-slate-50">
                                            <td className="px-6 py-3 text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-3 font-medium text-slate-900">{c.nombre}</td>
                                            <td className="px-6 py-3 text-gray-500">{c.nit || '—'}</td>
                                            <td className="px-6 py-3 text-gray-500">{c.telefono || '—'}</td>
                                            <td className="px-6 py-3 text-right font-bold text-amber-600">
                                                {(c.puntos_acumulados || 0).toLocaleString()} pts
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-600">
                                                {formatearBs(valor)}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => abrirDetalle(c)}
                                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                                >
                                                    Ver historial
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal detalle */}
            {clienteSel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{clienteSel.nombre}</h3>
                                <p className="text-xs text-gray-400 mt-1">NIT: {clienteSel.nit || '—'}</p>
                                <p className="text-3xl font-bold text-amber-600 mt-3">
                                    {(detalle?.saldo ?? clienteSel.puntos_acumulados ?? 0).toLocaleString()} pts
                                </p>
                            </div>
                            <button
                                onClick={cerrarDetalle}
                                className="text-gray-400 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Ajuste manual */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Ajuste manual</p>
                            <form onSubmit={aplicarAjuste} className="flex flex-wrap gap-2 items-end">
                                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                                    <button
                                        type="button"
                                        onClick={() => setAjuste({ ...ajuste, signo: '+' })}
                                        className={`px-3 py-2 ${ajuste.signo === '+' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'}`}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAjuste({ ...ajuste, signo: '-' })}
                                        className={`px-3 py-2 ${ajuste.signo === '-' ? 'bg-red-500 text-white' : 'bg-white text-gray-600'}`}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Puntos"
                                    value={ajuste.puntos}
                                    onChange={(e) => setAjuste({ ...ajuste, puntos: e.target.value })}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Motivo del ajuste"
                                    value={ajuste.motivo}
                                    onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
                                    required
                                />
                                <Button
                                    type="submit"
                                    loading={aplicandoAjuste}
                                    fullWidth={false}
                                    size="small"
                                >
                                    Aplicar
                                </Button>
                            </form>
                        </div>

                        {/* Movimientos */}
                        <div className="flex-1 overflow-y-auto">
                            {loadingDetalle ? (
                                <div className="p-8 text-center text-gray-400">Cargando...</div>
                            ) : !detalle?.movimientos?.length ? (
                                <div className="p-8 text-center text-gray-400">Sin movimientos registrados</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Puntos</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalle.movimientos.map((m) => (
                                            <tr key={m.id} className="border-b border-gray-100">
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                    {new Date(m.created_at).toLocaleString('es-BO')}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor(m.tipo)}`}>
                                                        {m.tipo_display}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-gray-600">{m.descripcion}</td>
                                                <td className={`px-4 py-2 text-right font-bold ${m.puntos >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {m.puntos >= 0 ? '+' : ''}{m.puntos}
                                                </td>
                                                <td className="px-4 py-2 text-right text-slate-700 font-medium">
                                                    {m.saldo_despues}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PuntosModule;
