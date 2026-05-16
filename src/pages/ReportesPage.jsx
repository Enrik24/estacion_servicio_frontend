import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Filter, Loader2, FileSpreadsheet, FileText, Globe, Mic, Mail, Settings, ListTree, ArrowUpDown, Check, X } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import VentasTab from '../components/reportes/VentasTab';
import TurnosTab from '../components/reportes/TurnosTab';
import ClientesTab from '../components/reportes/ClientesTab';
import SucursalesTab from '../components/reportes/SucursalesTab';
import IslasTab from '../components/reportes/IslasTab';
import { reportesService } from '../services/reportesService';
import { exportToExcel, exportToPDF, exportToHTML } from '../utils/exportUtils';
import VoiceAssistantModal from '../components/reportes/VoiceAssistantModal';

const TABS = [
    { key: 'ventas', label: 'Ventas' },
    { key: 'turnos', label: 'Turnos' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'sucursales', label: 'Sucursales' },
    { key: 'islas', label: 'Islas' },
];

// ---- helpers to flatten data for export ----
const flattenVentas = (d) => {
    if (!d) return { rows: [], headers: [] };
    const rows = (d.por_combustible || []).map(c => ({
        tipo: c.tipo_combustible, recaudado: c.total_recaudado, litros: c.total_litros, cantidad: c.cantidad,
    }));
    return { rows, headers: [
        { key: 'tipo', label: 'Combustible' }, { key: 'recaudado', label: 'Recaudado (Bs.)' },
        { key: 'litros', label: 'Litros' }, { key: 'cantidad', label: 'Cantidad' },
    ]};
};
const flattenTurnos = (d) => {
    if (!d) return { rows: [], headers: [] };
    const rows = (d.turnos || []).map(t => ({
        id: t.id, operador: t.operador, isla: t.isla, horario: t.horario,
        estado: t.estado, recaudado: t.total_recaudado, litros: t.total_litros, ventas: t.cantidad_ventas,
    }));
    return { rows, headers: [
        { key: 'id', label: 'ID' }, { key: 'operador', label: 'Operador' }, { key: 'isla', label: 'Isla' },
        { key: 'horario', label: 'Horario' }, { key: 'estado', label: 'Estado' },
        { key: 'recaudado', label: 'Recaudado (Bs.)' }, { key: 'litros', label: 'Litros' }, { key: 'ventas', label: 'Ventas' },
    ]};
};
const flattenClientes = (d) => {
    if (!d) return { rows: [], headers: [] };
    const rows = (d.ranking_clientes || []).map(c => ({
        nombre: c.cliente_nombre, nit: c.cliente_nit, consumido: c.total_consumido,
        litros: c.total_litros, ventas: c.cantidad_ventas,
    }));
    return { rows, headers: [
        { key: 'nombre', label: 'Cliente' }, { key: 'nit', label: 'NIT' },
        { key: 'consumido', label: 'Consumido (Bs.)' }, { key: 'litros', label: 'Litros' }, { key: 'ventas', label: 'Ventas' },
    ]};
};
const flattenSucursales = (d) => {
    if (!d) return { rows: [], headers: [] };
    const rows = (d.sucursales || []).map(s => ({
        nombre: s.nombre, direccion: s.direccion, estado: s.estado,
        recaudado: s.total_recaudado, litros: s.total_litros, ventas: s.cantidad_ventas, turnos: s.cantidad_turnos,
    }));
    return { rows, headers: [
        { key: 'nombre', label: 'Sucursal' }, { key: 'direccion', label: 'Dirección' }, { key: 'estado', label: 'Estado' },
        { key: 'recaudado', label: 'Recaudado (Bs.)' }, { key: 'litros', label: 'Litros' },
        { key: 'ventas', label: 'Ventas' }, { key: 'turnos', label: 'Turnos' },
    ]};
};
const flattenIslas = (d) => {
    if (!d) return { rows: [], headers: [] };
    const rows = (d.islas || []).flatMap(isla =>
        (isla.lados || []).map(l => ({
            isla: isla.numero, sucursal: isla.sucursal, lado: l.lado,
            recaudado: l.total_recaudado, litros: l.total_litros, ventas: l.cantidad_ventas,
        }))
    );
    return { rows, headers: [
        { key: 'isla', label: 'Isla' }, { key: 'sucursal', label: 'Sucursal' }, { key: 'lado', label: 'Lado' },
        { key: 'recaudado', label: 'Recaudado (Bs.)' }, { key: 'litros', label: 'Litros' }, { key: 'ventas', label: 'Ventas' },
    ]};
};
const FLATTEN = { ventas: flattenVentas, turnos: flattenTurnos, clientes: flattenClientes, sucursales: flattenSucursales, islas: flattenIslas };

const defaultColumns = {
    ventas: ['tipo', 'recaudado', 'litros', 'cantidad'],
    turnos: ['id', 'operador', 'isla', 'horario', 'estado', 'recaudado', 'litros', 'ventas'],
    clientes: ['nombre', 'nit', 'consumido', 'litros', 'ventas'],
    sucursales: ['nombre', 'direccion', 'estado', 'recaudado', 'litros', 'ventas', 'turnos'],
    islas: ['isla', 'sucursal', 'lado', 'recaudado', 'litros', 'ventas']
};

function ReportesPage() {
    const [activeTab, setActiveTab] = useState('ventas');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Generador de Reportes (Configurador)
    const [showConfigurator, setShowConfigurator] = useState(false);
    const [configuratorTab, setConfiguratorTab] = useState('filtros'); // 'filtros', 'columnas', 'orden'
    const [filters, setFilters] = useState({ fecha_inicio: '', fecha_fin: '', tipo_combustible: '', metodo_pago: '', sucursal_id: '', horario: '', estado: '', isla_id: '', cliente_id: '' });
    const [selectedColumns, setSelectedColumns] = useState(defaultColumns);
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    
    // Email Modal
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailFormData, setEmailFormData] = useState({ destinatario: '', asunto: '', formato: 'pdf' });
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

    const fetchData = async (tab, f) => {
        setLoading(true); setError(null);
        try {
            const svc = { ventas: reportesService.getVentas, turnos: reportesService.getTurnos, clientes: reportesService.getClientes, sucursales: reportesService.getSucursales, islas: reportesService.getIslas };
            const res = await svc[tab](f);
            setData(prev => ({ ...prev, [tab]: res.data }));
            return res.data;
        } catch (err) { 
            console.error('[ReportesPage] Error en fetchData:', err);
            if (err.response) {
                console.error('[ReportesPage] Detalles del error del servidor:', err.response.data);
                console.error('[ReportesPage] Status:', err.response.status);
            }
            setError(`Error al cargar reporte: ${err.message}`); 
            return null;
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(activeTab, filters); }, [activeTab]);

    const handleApplyFilters = () => { fetchData(activeTab, filters); };
    const handleClearFilters = () => { 
        setFilters({ fecha_inicio: '', fecha_fin: '', tipo_combustible: '', metodo_pago: '', sucursal_id: '', horario: '', estado: '', isla_id: '', cliente_id: '' }); 
        fetchData(activeTab, {}); 
    };

    // Helper para procesar datos antes de exportar
    const getProcessedData = () => {
        const flat = FLATTEN[activeTab](data[activeTab]);
        if (!flat || !flat.rows.length) return null;

        // Filtrar columnas
        const activeCols = selectedColumns[activeTab] || flat.headers.map(h => h.key);
        const filteredHeaders = flat.headers.filter(h => activeCols.includes(h.key));
        
        // Ordenar datos
        let processedRows = [...flat.rows];
        if (sortBy) {
            processedRows.sort((a, b) => {
                let valA = a[sortBy];
                let valB = b[sortBy];
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return { headers: filteredHeaders, rows: processedRows };
    };

    const handleExport = (format) => {
        const processed = getProcessedData();
        if (!processed) return alert('No hay datos para exportar');
        const title = `Reporte de ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
        const fname = `reporte_${activeTab}_${new Date().toISOString().slice(0,10)}`;
        if (format === 'excel') exportToExcel(processed.rows, processed.headers, title, fname);
        if (format === 'pdf') exportToPDF(processed.rows, processed.headers, title, fname);
        if (format === 'html') exportToHTML(processed.rows, processed.headers, title, fname);
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        const processed = getProcessedData();
        if (!processed) return alert('No hay datos para exportar');
        
        setIsSendingEmail(true);
        const payload = {
            destinatario: emailFormData.destinatario,
            asunto: emailFormData.asunto || `Reporte de ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
            tipo_reporte: activeTab,
            formato: emailFormData.formato,
            columnas: processed.headers.map(h => h.label),
            datos: processed.rows.map(row => processed.headers.map(h => String(row[h.key] ?? '')))
        };
        
        try {
            await reportesService.sendEmail(payload);
            alert('Email enviado correctamente');
            setShowEmailModal(false);
            setEmailFormData({ destinatario: '', asunto: '', formato: 'pdf' });
        } catch (error) {
            alert('Error al enviar email: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsSendingEmail(false);
        }
    };

    const toggleColumn = (tab, colKey) => {
        setSelectedColumns(prev => {
            const current = prev[tab] || [];
            if (current.includes(colKey)) {
                return { ...prev, [tab]: current.filter(k => k !== colKey) };
            } else {
                return { ...prev, [tab]: [...current, colKey] };
            }
        });
    };

    const updateFilter = (key, val) => setFilters(p => ({ ...p, [key]: val }));

    // Ejecuta un comando interpretado por el asistente de voz
    const executeVoiceCommand = useCallback(async (interpretacion) => {
        console.log('[ReportesPage] --- EJECUTANDO COMANDO DE VOZ ---');
        console.log('[ReportesPage] Datos recibidos de Gemini:', interpretacion);

        const { pestana, params, formato } = interpretacion;

        // 1. Cambiar pestaña
        if (pestana) {
            console.log(`[ReportesPage] Cambiando pestaña a: ${pestana}`);
            setActiveTab(pestana);
        }

        // 2. Aplicar filtros interpretados
        if (params && Object.keys(params).length > 0) {
            console.log('[ReportesPage] Aplicando nuevos filtros:', params);
            setFilters(prev => ({ ...prev, ...params }));
        } else {
            console.log('[ReportesPage] No se recibieron filtros específicos.');
        }

        // 3. Recargar datos con la pestaña y filtros nuevos
        const targetTab = pestana || activeTab;
        const mergedFilters = params && Object.keys(params).length > 0
            ? { ...filters, ...params }
            : filters;

        console.log(`[ReportesPage] Refrescando datos para ${targetTab}...`);
        const fetchedData = await fetchData(targetTab, mergedFilters);

        // 4. Exportar si se pidió un formato
        if (formato && fetchedData) {
            console.log(`[ReportesPage] Solicitud de exportación detectada: ${formato}`);
            
            // Usamos los datos recién obtenidos (fetchedData) y la pestaña destino (targetTab)
            // para evitar problemas de estado obsoleto en el closure.
            const tempFlat = FLATTEN[targetTab](fetchedData);
            
            // Re-aplicar lógica de columnas y orden actuales para la exportación por voz
            const activeCols = selectedColumns[targetTab] || tempFlat.headers.map(h => h.key);
            const filteredHeaders = tempFlat.headers.filter(h => activeCols.includes(h.key));
            let processedRows = [...tempFlat.rows];
            if (sortBy) {
                processedRows.sort((a, b) => {
                    let valA = a[sortBy]; let valB = b[sortBy];
                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();
                    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            if (!processedRows.length) {
                alert('No hay datos para exportar');
            } else {
                const title = `Reporte de ${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`;
                const fname = `reporte_${targetTab}_${new Date().toISOString().slice(0,10)}`;
                
                console.log(`[ReportesPage] Ejecutando exportación directa a ${formato}...`);
                if (formato === 'excel') exportToExcel(processedRows, filteredHeaders, title, fname);
                if (formato === 'pdf') exportToPDF(processedRows, filteredHeaders, title, fname);
                if (formato === 'html') exportToHTML(processedRows, filteredHeaders, title, fname);
            }
        }
        console.log('[ReportesPage] --- FIN EJECUCIÓN COMANDO ---');
    }, [activeTab, filters, selectedColumns, sortBy, sortOrder]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    {/* Title */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg"><BarChart3 className="w-6 h-6 text-emerald-600" /></div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Inteligencia de Negocio</h1>
                                <p className="text-sm text-gray-500">Reportes y análisis de la operación</p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setShowConfigurator(!showConfigurator)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition ${showConfigurator ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}>
                                <Settings className="w-4 h-4" /> Configurar Reporte
                            </button>
                            <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"><FileSpreadsheet className="w-4 h-4" />Excel</button>
                            <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition shadow-sm"><FileText className="w-4 h-4" />PDF</button>
                            <button onClick={() => handleExport('html')} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm"><Globe className="w-4 h-4" />HTML</button>
                            <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition shadow-sm"><Mail className="w-4 h-4" />Email</button>
                        </div>
                    </div>

                    {/* Configurador de Reporte */}
                    {showConfigurator && (
                        <div className="bg-white rounded-xl border border-gray-200 mb-6 shadow-sm overflow-hidden">
                            <div className="flex border-b border-gray-200">
                                <button onClick={() => setConfiguratorTab('filtros')} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium ${configuratorTab === 'filtros' ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                    <Filter className="w-4 h-4" /> Criterios de Selección
                                </button>
                                <button onClick={() => setConfiguratorTab('columnas')} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium ${configuratorTab === 'columnas' ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                    <ListTree className="w-4 h-4" /> Elegir Columnas
                                </button>
                                <button onClick={() => setConfiguratorTab('orden')} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium ${configuratorTab === 'orden' ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                    <ArrowUpDown className="w-4 h-4" /> Ordenar Por
                                </button>
                            </div>
                            
                            <div className="p-5">
                                {configuratorTab === 'filtros' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fecha Inicio</label><input type="date" value={filters.fecha_inicio} onChange={e => updateFilter('fecha_inicio', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                            <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fecha Fin</label><input type="date" value={filters.fecha_fin} onChange={e => updateFilter('fecha_fin', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                            {(activeTab === 'ventas') && (
                                                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo Combustible</label><select value={filters.tipo_combustible} onChange={e => updateFilter('tipo_combustible', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">Todos</option><option value="GASOLINA_PREMIUM">Gasolina Premium</option><option value="GASOLINA_ESPECIAL">Gasolina Especial</option><option value="DIESEL">Diesel</option><option value="GNV">GNV</option></select></div>
                                            )}
                                            {(activeTab === 'ventas' || activeTab === 'clientes') && (
                                                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Método de Pago</label><select value={filters.metodo_pago} onChange={e => updateFilter('metodo_pago', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">Todos</option><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="QR">QR</option><option value="CREDITO_FLEET">Crédito Fleet</option></select></div>
                                            )}
                                            {(activeTab === 'turnos') && (
                                                <>
                                                    <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Horario</label><select value={filters.horario} onChange={e => updateFilter('horario', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">Todos</option><option value="MANANA">Mañana</option><option value="TARDE">Tarde</option><option value="NOCHE">Noche</option></select></div>
                                                    <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Estado</label><select value={filters.estado} onChange={e => updateFilter('estado', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">Todos</option><option value="ABIERTO">Abierto</option><option value="CERRADO">Cerrado</option></select></div>
                                                </>
                                            )}
                                            {(activeTab === 'sucursales') && (
                                                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Estado Sucursal</label><select value={filters.estado} onChange={e => updateFilter('estado', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">Todos</option><option value="ACTIVA">Activa</option><option value="INACTIVA">Inactiva</option></select></div>
                                            )}
                                            {(activeTab === 'ventas' || activeTab === 'sucursales' || activeTab === 'islas') && (
                                                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sucursal ID</label><input type="number" value={filters.sucursal_id} onChange={e => updateFilter('sucursal_id', e.target.value)} placeholder="ID" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                            )}
                                            {(activeTab === 'turnos' || activeTab === 'islas') && (
                                                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Isla ID</label><input type="number" value={filters.isla_id} onChange={e => updateFilter('isla_id', e.target.value)} placeholder="ID" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                            )}
                                            {(activeTab === 'clientes') && (
                                                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cliente ID</label><input type="number" value={filters.cliente_id} onChange={e => updateFilter('cliente_id', e.target.value)} placeholder="ID" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                            )}
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={handleApplyFilters} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">Aplicar Filtros</button>
                                            <button onClick={handleClearFilters} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition">Limpiar</button>
                                        </div>
                                    </div>
                                )}
                                
                                {configuratorTab === 'columnas' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <p className="text-sm text-gray-500 mb-4">Selecciona las columnas que deseas visualizar y exportar en tu reporte de <strong>{TABS.find(t => t.key === activeTab)?.label}</strong>.</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {FLATTEN[activeTab](data[activeTab] || null).headers.map(h => (
                                                <label key={h.key} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${selectedColumns[activeTab]?.includes(h.key) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedColumns[activeTab]?.includes(h.key) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                                                        {selectedColumns[activeTab]?.includes(h.key) && <Check className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden"
                                                        checked={selectedColumns[activeTab]?.includes(h.key) || false}
                                                        onChange={() => toggleColumn(activeTab, h.key)}
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">{h.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {configuratorTab === 'orden' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <p className="text-sm text-gray-500 mb-4">Configura cómo deseas ordenar los resultados generados en el reporte.</p>
                                        <div className="flex gap-4 max-w-md">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Campo a ordenar</label>
                                                <select 
                                                    value={sortBy} 
                                                    onChange={e => setSortBy(e.target.value)} 
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="">Por defecto (ID/Fecha)</option>
                                                    {FLATTEN[activeTab](data[activeTab] || null).headers.map(h => (
                                                        <option key={h.key} value={h.key}>{h.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dirección</label>
                                                <select 
                                                    value={sortOrder} 
                                                    onChange={e => setSortOrder(e.target.value)} 
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="asc">Ascendente</option>
                                                    <option value="desc">Descendente</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 shadow-sm overflow-x-auto">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 min-w-[100px] px-4 py-2.5 text-sm font-medium rounded-lg transition ${activeTab === tab.key ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
                    ) : (
                        <>
                            {activeTab === 'ventas' && <VentasTab data={data.ventas} />}
                            {activeTab === 'turnos' && <TurnosTab data={data.turnos} />}
                            {activeTab === 'clientes' && <ClientesTab data={data.clientes} />}
                            {activeTab === 'sucursales' && <SucursalesTab data={data.sucursales} />}
                            {activeTab === 'islas' && <IslasTab data={data.islas} />}
                        </>
                    )}
                </main>
            </div>

            {/* FAB de micrófono - esquina inferior derecha */}
            {!isVoiceModalOpen && (
                <button
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
                    title="Asistente de voz"
                >
                    <Mic className="w-6 h-6" />
                </button>
            )}

            {/* Voice Assistant Modal - anclado en esquina inferior derecha */}
            <VoiceAssistantModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onCommand={executeVoiceCommand}
            />
            {/* Modal de Envío por Email */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-indigo-600" /> Enviar Reporte por Email
                            </h3>
                            <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="ejemplo@correo.com"
                                    value={emailFormData.destinatario}
                                    onChange={e => setEmailFormData({...emailFormData, destinatario: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                                <input 
                                    type="text" 
                                    placeholder={`Reporte de ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                                    value={emailFormData.asunto}
                                    onChange={e => setEmailFormData({...emailFormData, asunto: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Formato Adjunto</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['pdf', 'excel', 'html'].map(fmt => (
                                        <label key={fmt} className={`flex items-center justify-center py-2 px-3 border rounded-lg cursor-pointer transition ${emailFormData.formato === fmt ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                            <input 
                                                type="radio" 
                                                name="formato" 
                                                value={fmt} 
                                                checked={emailFormData.formato === fmt} 
                                                onChange={e => setEmailFormData({...emailFormData, formato: e.target.value})}
                                                className="hidden" 
                                            />
                                            <span className="uppercase text-sm">{fmt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowEmailModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">Cancelar</button>
                                <button type="submit" disabled={isSendingEmail} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isSendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                                    {isSendingEmail ? 'Enviando...' : 'Enviar Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportesPage;
