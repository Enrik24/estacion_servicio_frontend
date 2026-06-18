import { useState, useEffect } from 'react';
import { Droplets, Plus, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { inventarioService } from '../services/inventarioService';
import apiClient from '../services/api';

function NivelBar({ porcentaje, enAlerta }) {
    const color = enAlerta ? 'bg-red-500' : porcentaje < 50 ? 'bg-amber-400' : 'bg-emerald-500';
    return (
        <div className="w-full bg-gray-200 rounded-full h-3">
            <div
                className={`h-3 rounded-full transition-all ${color} ${enAlerta ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
        </div>
    );
}

function InventarioPage() {
    const [tanques, setTanques] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [tiposCombustible, setTiposCombustible] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [descargas, setDescargas] = useState([]);
const [showHistorialModal, setShowHistorialModal] = useState(false);
const [filtroSucursal, setFiltroSucursal] = useState('');
const [filtroCombustible, setFiltroCombustible] = useState('');
const [filtroFecha, setFiltroFecha] = useState('');
const [showHistorial, setShowHistorial] = useState(false);

    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showDescargaModal, setShowDescargaModal] = useState(false);
    const [showAmpliarModal, setShowAmpliarModal] = useState(false);
    const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
    

    const [formTanque, setFormTanque] = useState({
        sucursal: '', tipo_combustible: '',
        capacidad_maxima: '', nivel_actual: '', nivel_minimo_alerta: ''
    });
    const [formDescarga, setFormDescarga] = useState({ volumen_descargado: '', observaciones: '' });
    const [formAmpliar, setFormAmpliar] = useState({ capacidad_maxima: '' });
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
    setLoading(true);
    try {
        const [tanquesRes, sucursalesRes, tiposRes] = await Promise.all([
            inventarioService.getTanques(),
            inventarioService.getSucursales(),
            inventarioService.getTiposCombustible(),
        ]);
        
        setTanques(Array.isArray(tanquesRes.data) ? tanquesRes.data : tanquesRes.data.results || []);
        setSucursales(Array.isArray(sucursalesRes.data) ? sucursalesRes.data : sucursalesRes.data.results || []);
        setTiposCombustible(Array.isArray(tiposRes.data) ? tiposRes.data : tiposRes.data.results || []);

        // Cargar descargas por separado para no romper todo si falla
       try {
    const descargasRes = await apiClient.get('/inventario/descargas/');
    setDescargas(Array.isArray(descargasRes.data) ? descargasRes.data : descargasRes.data.results || []);
} catch (err) {
    setDescargas([]);
}

    } catch {
        setError('Error al cargar datos');
    } finally {
        setLoading(false);
    }
};

    const handleCrearTanque = async (e) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            await inventarioService.crearTanque(formTanque);
            setExito('Tanque creado correctamente');
            setShowCrearModal(false);
            setFormTanque({ sucursal: '', tipo_combustible: '', capacidad_maxima: '', nivel_actual: '', nivel_minimo_alerta: '' });
            await cargarDatos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear tanque');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDescarga = async (e) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            await inventarioService.registrarDescarga(tanqueSeleccionado.id, formDescarga);
            setExito('Descarga registrada correctamente');
            setShowDescargaModal(false);
            setFormDescarga({ volumen_descargado: '', observaciones: '' });
            await cargarDatos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar descarga');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleAmpliar = async (e) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            await inventarioService.ampliarCapacidad(tanqueSeleccionado.id, formAmpliar);
            setExito('Capacidad ampliada correctamente');
            setShowAmpliarModal(false);
            setFormAmpliar({ capacidad_maxima: '' });
            await cargarDatos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al ampliar capacidad');
        } finally {
            setLoadingAction(false);
        }
    };

    const tanquesEnAlerta = tanques.filter(t => t.en_alerta);
const descargasFiltradas = descargas.filter(d => {
    const matchSucursal = !filtroSucursal || d.tanque_sucursal === filtroSucursal;
    const matchCombustible = !filtroCombustible || d.tanque_tipo_combustible === filtroCombustible;
    const matchFecha = !filtroFecha || d.fecha.startsWith(filtroFecha);
    return matchSucursal && matchCombustible && matchFecha;
});
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-6 h-6 text-blue-500" />
                                Control de Combustible
                            </h1>
                            <p className="text-xs text-gray-400 mt-1">Niveles de tanques y descargas</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={cargarDatos} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <Button onClick={() => setShowCrearModal(true)} fullWidth={false} size="small">
                                <Plus className="w-4 h-4 mr-1" /> Nuevo Tanque
                            </Button>
                        </div>
                    </div>

                    {/* Alertas */}
                    {tanquesEnAlerta.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <p className="font-semibold text-red-700">
                                    {tanquesEnAlerta.length} tanque{tanquesEnAlerta.length > 1 ? 's' : ''} en nivel crítico
                                </p>
                            </div>
                            <div className="space-y-1">
                                {tanquesEnAlerta.map(t => (
                                    <p key={t.id} className="text-sm text-red-600">
                                        • {t.sucursal_nombre} — {t.tipo_combustible_nombre}: {t.nivel_actual} Lt ({t.porcentaje_nivel}%)
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}
                    {exito && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm">{exito}</div>}

                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Total Tanques</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{tanques.length}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold">En alerta</p>
                            <p className={`text-2xl font-bold mt-1 ${tanquesEnAlerta.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {tanquesEnAlerta.length}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <p className="text-xs text-gray-500 uppercase font-semibold">Total combustible</p>
    <select
        className="text-xs text-gray-400 border-none outline-none bg-transparent mt-1 mb-1"
        value={filtroCombustible}
        onChange={e => setFiltroCombustible(e.target.value)}
    >
        <option value="">Todos los tipos</option>
        {tiposCombustible.map(t => (
            <option key={t.id} value={t.tipo_display || t.tipo.replace(/_/g, ' ')}>
                {t.tipo_display || t.tipo.replace(/_/g, ' ')}
            </option>
        ))}
    </select>
    <p className="text-2xl font-bold text-slate-900">
        {tanques
            .filter(t => !filtroCombustible || t.tipo_combustible_nombre === filtroCombustible)
            .reduce((acc, t) => acc + parseFloat(t.nivel_actual), 0)
            .toFixed(0)} Lt
    </p>
</div>
                    </div>

                    {/* Tanques */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Cargando tanques...</div>
                    ) : tanques.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                            No hay tanques registrados
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tanques.map(t => (
                                <div key={t.id} className={`bg-white rounded-xl border shadow-sm p-5 space-y-4 ${t.en_alerta ? 'border-red-300' : 'border-gray-200'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">{t.sucursal_nombre}</p>
                                            <h3 className="font-bold text-slate-900">{t.tipo_combustible_nombre}</h3>
                                        </div>
                                        {t.en_alerta && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">
                                                <AlertTriangle className="w-3 h-3" /> Crítico
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500">Nivel actual</span>
                                            <span className="font-semibold text-slate-900">{t.porcentaje_nivel}%</span>
                                        </div>
                                        <NivelBar porcentaje={t.porcentaje_nivel} enAlerta={t.en_alerta} />
                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>{parseFloat(t.nivel_actual).toFixed(0)} Lt</span>
                                            <span>{parseFloat(t.capacidad_maxima).toFixed(0)} Lt</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => { setTanqueSeleccionado(t); setShowDescargaModal(true); }}
                                            className="flex-1 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                                        >
                                            Registrar Descarga
                                        </button>
                                        <button
                                            onClick={() => { setTanqueSeleccionado(t); setFormAmpliar({ capacidad_maxima: t.capacidad_maxima }); setShowAmpliarModal(true); }}
                                            className="flex-1 py-1.5 text-xs font-semibold bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                                        >
                                            Ampliar Capacidad
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                    )}

                  {/* Historial de Descargas - Colapsable */}
<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <button
        onClick={() => setShowHistorial(!showHistorial)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
    >
        <h2 className="text-lg font-bold text-slate-900">Historial de Descargas</h2>
        <span className="text-xs text-gray-400 flex items-center gap-2">
            {descargasFiltradas.length} registros
            <span className="text-gray-400">{showHistorial ? '▲' : '▼'}</span>
        </span>
    </button>

    {showHistorial && (
        <>
            <div className="px-6 py-3 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select value={filtroSucursal} onChange={e => setFiltroSucursal(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option value="">Todas las sucursales</option>
                        {sucursales.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                    </select>
                    <select value={filtroCombustible} onChange={e => setFiltroCombustible(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option value="">Todos los combustibles</option>
                        {tiposCombustible.map(t => (
                            <option key={t.id} value={t.tipo_display || t.tipo.replace(/_/g, ' ')}>
                                {t.tipo_display || t.tipo.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                    <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Sucursal</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Combustible</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Volumen</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Nivel Antes</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Nivel Después</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Registrado por</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {descargasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                    No hay descargas registradas
                                </td>
                            </tr>
                        ) : (
                            descargasFiltradas.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(d.fecha).toLocaleString('es-BO')}</td>
                                    <td className="px-4 py-3 text-gray-600">{d.tanque_sucursal}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{d.tanque_tipo_combustible}</span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">+{parseFloat(d.volumen_descargado).toFixed(0)} Lt</td>
                                    <td className="px-4 py-3 text-gray-500">{parseFloat(d.nivel_antes).toFixed(0)} Lt</td>
                                    <td className="px-4 py-3 text-gray-500">{parseFloat(d.nivel_despues).toFixed(0)} Lt</td>
                                    <td className="px-4 py-3 text-gray-600">{d.registrado_por_nombre}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{d.observaciones || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )}
</div>

                </main>
            </div>

            {/* Modal crear tanque */}
            {showCrearModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Nuevo Tanque</h3>
                        <form onSubmit={handleCrearTanque} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Sucursal</label>
                                <select value={formTanque.sucursal} onChange={e => setFormTanque({...formTanque, sucursal: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                                    <option value="">Selecciona una sucursal</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Tipo de combustible</label>
                                <select value={formTanque.tipo_combustible} onChange={e => setFormTanque({...formTanque, tipo_combustible: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                                    <option value="">Selecciona el tipo</option>
                                    {tiposCombustible.map(t => <option key={t.id} value={t.id}>{t.tipo.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <Input label="Capacidad máxima (Lt)" type="number" step="0.01" value={formTanque.capacidad_maxima} onChange={e => { const cap = e.target.value; setFormTanque({...formTanque, capacidad_maxima: cap, nivel_minimo_alerta: (cap * 0.2).toFixed(2)}); }} required />
                            <Input label="Nivel inicial (Lt)" type="number" step="0.01" value={formTanque.nivel_actual} onChange={e => setFormTanque({...formTanque, nivel_actual: e.target.value})} required />
                            <Input label="Nivel mínimo de alerta (Lt)" type="number" step="0.01" value={formTanque.nivel_minimo_alerta} onChange={e => setFormTanque({...formTanque, nivel_minimo_alerta: e.target.value})} required />
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" loading={loadingAction}>Crear tanque</Button>
                                <Button type="button" onClick={() => setShowCrearModal(false)} className="!bg-gray-200 !text-gray-700">Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal descarga */}
            {showDescargaModal && tanqueSeleccionado && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-1">Registrar Descarga de Cisterna</h3>
            <p className="text-xs text-gray-400 mb-4">{tanqueSeleccionado.sucursal_nombre} — {tanqueSeleccionado.tipo_combustible_nombre}</p>
            
            {/* Info del tanque */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Nivel actual:</span>
                    <span className="font-semibold">{parseFloat(tanqueSeleccionado.nivel_actual).toFixed(0)} Lt</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Capacidad máxima:</span>
                    <span className="font-semibold">{parseFloat(tanqueSeleccionado.capacidad_maxima).toFixed(0)} Lt</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Disponible para llenar:</span>
                    <span className="font-semibold text-blue-600">
                        {(parseFloat(tanqueSeleccionado.capacidad_maxima) - parseFloat(tanqueSeleccionado.nivel_actual)).toFixed(0)} Lt
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Nivel mínimo alerta:</span>
                    <span className="font-semibold text-orange-500">{parseFloat(tanqueSeleccionado.nivel_minimo_alerta).toFixed(0)} Lt</span>
                </div>
                <NivelBar porcentaje={tanqueSeleccionado.porcentaje_nivel} enAlerta={tanqueSeleccionado.en_alerta} />
            </div>

            <form onSubmit={handleDescarga} className="space-y-4">
                <Input 
                    label="Volumen a descargar (Lt)" 
                    type="number" 
                    step="0.01"
                    min="1"
                    max={parseFloat(tanqueSeleccionado.capacidad_maxima) - parseFloat(tanqueSeleccionado.nivel_actual)}
                    value={formDescarga.volumen_descargado} 
                    onChange={e => setFormDescarga({...formDescarga, volumen_descargado: e.target.value})} 
                    required 
                />
                
                {/* Preview del nivel resultante */}
                {formDescarga.volumen_descargado && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <p className="text-blue-700 font-semibold">
                            Nivel resultante: {(parseFloat(tanqueSeleccionado.nivel_actual) + parseFloat(formDescarga.volumen_descargado || 0)).toFixed(0)} Lt
                        </p>
                        <p className="text-blue-500 text-xs mt-0.5">
                            ({(((parseFloat(tanqueSeleccionado.nivel_actual) + parseFloat(formDescarga.volumen_descargado || 0)) / parseFloat(tanqueSeleccionado.capacidad_maxima)) * 100).toFixed(1)}% de capacidad)
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Observaciones</label>
                    <textarea 
                        value={formDescarga.observaciones} 
                        onChange={e => setFormDescarga({...formDescarga, observaciones: e.target.value})} 
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                        rows={3} 
                        placeholder="Ej: Descarga de camión cisterna, placa ABC-123..." 
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <Button type="submit" loading={loadingAction}>Registrar Descarga</Button>
                    <Button type="button" onClick={() => setShowDescargaModal(false)} className="!bg-gray-200 !text-gray-700">Cancelar</Button>
                </div>
            </form>
        </div>
    </div>
)}

            {/* Modal ampliar capacidad */}
            {showAmpliarModal && tanqueSeleccionado && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-1">Ampliar Capacidad</h3>
                        <p className="text-xs text-gray-400 mb-4">{tanqueSeleccionado.sucursal_nombre} — {tanqueSeleccionado.tipo_combustible_nombre}</p>
                        <p className="text-sm text-gray-600 mb-4">Capacidad actual: <span className="font-semibold">{parseFloat(tanqueSeleccionado.capacidad_maxima).toFixed(0)} Lt</span></p>
                        <form onSubmit={handleAmpliar} className="space-y-4">
                            <Input label="Nueva capacidad máxima (Lt)" type="number" step="0.01" value={formAmpliar.capacidad_maxima} onChange={e => setFormAmpliar({capacidad_maxima: e.target.value})} required />
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" loading={loadingAction}>Ampliar</Button>
                                <Button type="button" onClick={() => setShowAmpliarModal(false)} className="!bg-gray-200 !text-gray-700">Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventarioPage;