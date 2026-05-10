import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Loader2, AlertCircle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { reconocerVoz, interpretarComando } from '../../services/voiceService';

const EXAMPLE_COMMANDS = [
    'Genera reportes de Ventas en PDF',
    'Dame los reportes de Clientes en Excel',
    'Quiero los reportes Surtidores',
    'Exporta los reportes de los Turnos',
];

/**
 * Modal del Asistente de Voz — posicionado en esquina inferior derecha.
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - onCommand: ({ pestana, params, formato }) => void
 */
export default function VoiceAssistantModal({ isOpen, onClose, onCommand }) {
    // 'idle' | 'recording' | 'processing' | 'success' | 'error'
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [recognizedText, setRecognizedText] = useState('');
    const recognitionRef = useRef(null);

    // Limpiar estados al cerrar el modal
    useEffect(() => {
        if (!isOpen) {
            const timeout = setTimeout(() => {
                setStatus('idle');
                setErrorMessage('');
                setRecognizedText('');
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    // Cancelar reconocimiento si se desmonta
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (_) { /* ignore */ }
            }
        };
    }, []);

    const handleClose = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) { /* ignore */ }
            recognitionRef.current = null;
        }
        onClose();
    }, [onClose]);

    const startRecording = useCallback(async () => {
        setStatus('recording');
        setErrorMessage('');
        setRecognizedText('');

        try {
            const result = await reconocerVoz();
            recognitionRef.current = result.recognition;
            setRecognizedText(result.text);
            await processCommand(result.text);
        } catch (err) {
            if (err.message === 'Grabación cancelada.') {
                setStatus('idle');
                return;
            }
            setStatus('error');
            setErrorMessage(err.message);
        }
    }, []);

    const processCommand = async (texto) => {
        setStatus('processing');
        try {
            const interpretacion = await interpretarComando(texto);
            setStatus('success');
            // Breve pausa para feedback visual de éxito
            setTimeout(() => {
                onCommand(interpretacion);
                handleClose();
            }, 600);
        } catch (err) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    const cancelRecording = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) { /* ignore */ }
            recognitionRef.current = null;
        }
        setStatus('idle');
        setErrorMessage('');
        setRecognizedText('');
    }, []);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay sutil — clic para cerrar */}
            <div
                className="fixed inset-0 z-40"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
                onClick={handleClose}
            />

            {/* Modal anclado en esquina inferior derecha, justo arriba del FAB */}
            <div
                className="fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{
                    bottom: '5.5rem',
                    right: '1.5rem',
                    width: '340px',
                    animation: 'voiceModalSlideUp 0.25s ease-out',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <Mic className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h2 className="text-base font-bold text-slate-900">Asistente de voz</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 pb-5">
                    {/* --- IDLE state --- */}
                    {status === 'idle' && (
                        <>
                            <p className="text-gray-500 text-xs mb-4">
                                Presiona el micrófono y habla tu comando
                            </p>

                            {/* Ejemplos */}
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ejemplos:</p>
                                <div className="space-y-1.5">
                                    {EXAMPLE_COMMANDS.map((cmd, i) => (
                                        <div
                                            key={i}
                                            className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 flex items-start gap-2"
                                        >
                                            <span className="text-emerald-500 mt-0.5 flex-shrink-0">🎤</span>
                                            <span>"{cmd}"</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Record button */}
                            <button
                                onClick={startRecording}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md"
                            >
                                <Mic className="w-4 h-4" />
                                Iniciar Grabación
                            </button>
                        </>
                    )}

                    {/* --- RECORDING state --- */}
                    {status === 'recording' && (
                        <div className="flex flex-col items-center py-5">
                            {/* Animated mic */}
                            <div className="relative mb-4">
                                <div
                                    className="absolute inset-0 rounded-full bg-emerald-400"
                                    style={{
                                        animation: 'voicePulse 1.5s ease-in-out infinite',
                                    }}
                                />
                                <div className="relative w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                                    <Mic className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <p className="text-base font-semibold text-slate-900 mb-0.5">Escuchando...</p>
                            <p className="text-xs text-gray-400 mb-5">Habla tu comando de voz</p>
                            <button
                                onClick={cancelRecording}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 transition"
                            >
                                <MicOff className="w-3.5 h-3.5" />
                                Cancelar
                            </button>
                        </div>
                    )}

                    {/* --- PROCESSING state --- */}
                    {status === 'processing' && (
                        <div className="flex flex-col items-center py-6">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
                            <p className="text-base font-semibold text-slate-900 mb-1">Procesando...</p>
                            {recognizedText && (
                                <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 w-full">
                                    <p className="text-[10px] text-gray-400 mb-0.5">Entendí:</p>
                                    <p className="text-xs text-gray-700 italic">"{recognizedText}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- SUCCESS state --- */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center py-6">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-base font-semibold text-slate-900 mb-1">¡Comando procesado!</p>
                            {recognizedText && (
                                <p className="text-xs text-gray-500 italic">"{recognizedText}"</p>
                            )}
                        </div>
                    )}

                    {/* --- ERROR state --- */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center py-4">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mb-1">No se pudo procesar</p>
                            <p className="text-xs text-red-500 text-center mb-4 px-2">{errorMessage}</p>
                            {recognizedText && (
                                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 w-full">
                                    <p className="text-[10px] text-gray-400 mb-0.5">Entendí:</p>
                                    <p className="text-xs text-gray-700 italic">"{recognizedText}"</p>
                                </div>
                            )}
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={startRecording}
                                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-emerald-700 transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reintentar
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-gray-200 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Inline animation styles */}
            <style>{`
                @keyframes voiceModalSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes voicePulse {
                    0%   { transform: scale(1);   opacity: 0.6; }
                    50%  { transform: scale(1.5); opacity: 0; }
                    100% { transform: scale(1);   opacity: 0; }
                }
            `}</style>
        </>
    );
}
