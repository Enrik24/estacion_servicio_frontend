import { useState } from 'react';
import EstadoBadge from './EstadoBadge';
import { AlertTriangle, CheckCircle, Power } from 'lucide-react';

function IslaCard({ isla, onCambiarEstado }) {
    const [showModal, setShowModal] = useState(false);
    const [ladoSeleccionado, setLadoSeleccionado] = useState(null);
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);

    const abrirModal = (lado, estado) => {
        setLadoSeleccionado(lado);
        setNuevoEstado(estado);
        setDescripcion('');
        setShowModal(true);
    };

    const handleConfirmar = async () => {
        setLoading(true);
        await onCambiarEstado(ladoSeleccionado.id, nuevoEstado, descripcion);
        setLoading(false);
        setShowModal(false);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Isla {isla.numero}</h3>
                {isla.turno_activo ? (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                        {isla.turno_activo.operador} — {isla.turno_activo.horario}
                    </span>
                ) : (
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        Sin turno activo
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {isla.lados.map(lado => (
                    <div key={lado.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Lado {lado.lado}</span>
                            <EstadoBadge estado={lado.estado} />
                        </div>
                        <div className="flex gap-1">
                            {lado.estado !== 'ACTIVO' && (
                                <button
                                    onClick={() => abrirModal(lado, 'ACTIVO')}
                                    className="p-1 rounded hover:bg-emerald-100 text-emerald-600"
                                    title="Marcar como activo"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                            )}
                            {lado.estado !== 'INACTIVO' && (
                                <button
                                    onClick={() => abrirModal(lado, 'INACTIVO')}
                                    className="p-1 rounded hover:bg-gray-200 text-gray-500"
                                    title="Marcar como inactivo"
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                            )}
                            {lado.estado !== 'FALLA' && (
                                <button
                                    onClick={() => abrirModal(lado, 'FALLA')}
                                    className="p-1 rounded hover:bg-red-100 text-red-500"
                                    title="Reportar falla"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="font-bold text-slate-900">
                            {nuevoEstado === 'FALLA' ? '⚠️ Reportar Falla' :
                             nuevoEstado === 'INACTIVO' ? 'Desactivar Surtidor' :
                             '✅ Activar Surtidor'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Isla {isla.numero} — Lado {ladoSeleccionado?.lado}
                        </p>
                        {(nuevoEstado === 'FALLA' || nuevoEstado === 'INACTIVO') && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                                    {nuevoEstado === 'FALLA' ? 'Descripción de la falla' : 'Motivo'}
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                                    rows={3}
                                    placeholder={nuevoEstado === 'FALLA' ? 'Describe la falla...' : 'Motivo de desactivación...'}
                                />
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmar}
                                disabled={loading}
                                className={`flex-1 py-2 px-4 rounded-lg text-white text-sm font-semibold transition ${
                                    nuevoEstado === 'FALLA' ? 'bg-red-600 hover:bg-red-700' :
                                    nuevoEstado === 'INACTIVO' ? 'bg-gray-600 hover:bg-gray-700' :
                                    'bg-emerald-600 hover:bg-emerald-700'
                                } disabled:opacity-50`}
                            >
                                {loading ? 'Guardando...' : 'Confirmar'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IslaCard;