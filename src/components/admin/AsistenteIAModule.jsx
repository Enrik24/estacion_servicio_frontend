import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User, Loader2, Trash2, Lightbulb, Mic, MicOff } from 'lucide-react';
import { asistenteIAService } from '../../services/api';
import { reconocerVoz } from '../../services/voiceService';

const SUGERENCIAS_INICIALES = [
  '¿Cuánto vendí esta semana?',
  '¿Qué cliente consume más?',
  '¿Qué combustible se vende más este mes?',
  'Predice mi demanda de mañana',
];

const MENSAJE_BIENVENIDA = {
  rol: 'asistente',
  contenido:
    '¡Hola! 👋 Soy tu asistente de inteligencia de negocio. Puedo responder preguntas sobre ' +
    'tus ventas, clientes, turnos, combustibles y predicciones de demanda. ' +
    'Pregúntame en lenguaje natural, por ejemplo: "¿cuánto diésel vendí esta semana?".',
  sugerencias: SUGERENCIAS_INICIALES,
};

const ETIQUETA_INTENCION = {
  ventas: 'Ventas',
  combustible: 'Combustibles',
  clientes: 'Clientes',
  turnos: 'Turnos',
  prediccion: 'Predicción',
  desconocido: 'Ayuda',
};

function AsistenteIAModule() {
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Sugerencias activas = las del último mensaje del asistente
  const sugerenciasActivas = useMemo(() => {
    for (let i = mensajes.length - 1; i >= 0; i -= 1) {
      if (mensajes[i].rol === 'asistente' && mensajes[i].sugerencias?.length) {
        return mensajes[i].sugerencias;
      }
    }
    return SUGERENCIAS_INICIALES;
  }, [mensajes]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, loading]);

  const enviar = async (texto) => {
    const pregunta = (texto ?? input).trim();
    if (!pregunta || loading) return;

    setError('');
    setInput('');

    // Historial (últimos 6 turnos) ANTES de agregar la nueva pregunta
    const historial = mensajes
      .filter((m) => m.rol === 'usuario' || m.rol === 'asistente')
      .slice(-6)
      .map((m) => ({ rol: m.rol, contenido: m.contenido }));

    setMensajes((prev) => [...prev, { rol: 'usuario', contenido: pregunta }]);
    setLoading(true);

    try {
      const { data } = await asistenteIAService.preguntar(pregunta, historial);
      setMensajes((prev) => [
        ...prev,
        {
          rol: 'asistente',
          contenido: data.respuesta,
          sugerencias: data.sugerencias || [],
          intencion: data.intencion,
          datos: data.datos,
        },
      ]);
    } catch (err) {
      console.error('[AsistenteIA]', err);
      const msg =
        err.response?.data?.error ||
        'No se pudo obtener respuesta del asistente. Verifica tu conexión e intenta de nuevo.';
      setError(msg);
      setMensajes((prev) => [
        ...prev,
        {
          rol: 'asistente',
          contenido: `⚠️ ${msg}`,
          sugerencias: SUGERENCIAS_INICIALES,
          esError: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const limpiar = () => {
    setMensajes([MENSAJE_BIENVENIDA]);
    setError('');
    setInput('');
  };

  // Reconocimiento de voz (Web Speech API). Transcribe y envía automáticamente.
  const handleVoz = async () => {
    if (loading || escuchando) return;
    setError('');
    setEscuchando(true);
    try {
      const { text } = await reconocerVoz();
      setEscuchando(false);
      const limpio = (text || '').trim();
      if (limpio) {
        enviar(limpio);
      } else {
        setError('No se detectó voz. Intenta hablar más cerca del micrófono.');
      }
    } catch (err) {
      setEscuchando(false);
      setError(err.message || 'No se pudo usar el micrófono.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Asistente Conversacional IA</h2>
            <p className="text-sm text-slate-500">
              Pregunta en lenguaje natural sobre tu estación
            </p>
          </div>
        </div>
        <button
          onClick={limpiar}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition"
          title="Limpiar conversación"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>

      {/* Ventana de chat */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[60vh] min-h-[420px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensajes.map((m, idx) => (
            <Burbuja key={idx} mensaje={m} />
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <AvatarBot />
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analizando tus datos…</span>
              </div>
            </div>
          )}
        </div>

        {/* Sugerencias */}
        {!loading && sugerenciasActivas.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Sugerencias</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sugerenciasActivas.map((s, i) => (
                <button
                  key={i}
                  onClick={() => enviar(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Entrada */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={escuchando}
              placeholder={escuchando ? 'Escuchando… habla ahora' : 'Escribe tu pregunta…  (Enter para enviar)'}
              className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent max-h-32 disabled:bg-slate-50"
            />
            <button
              onClick={handleVoz}
              disabled={loading}
              className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                escuchando
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title={escuchando ? 'Escuchando…' : 'Hablar (entrada por voz)'}
            >
              {escuchando ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={() => enviar()}
              disabled={loading || escuchando || !input.trim()}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
              title="Enviar"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {escuchando && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Escuchando… habla y haré la consulta automáticamente.
            </p>
          )}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mt-3">
        Las respuestas se generan a partir de los datos reales de tu sucursal. Las predicciones son
        estimaciones basadas en el historial.
      </p>
    </div>
  );
}

function AvatarBot() {
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
      <Bot className="w-5 h-5 text-white" />
    </div>
  );
}

function Burbuja({ mensaje }) {
  const esUsuario = mensaje.rol === 'usuario';

  if (esUsuario) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{mensaje.contenido}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <AvatarBot />
      <div className="max-w-[80%]">
        {mensaje.intencion && !mensaje.esError && (
          <span className="inline-block text-[10px] uppercase tracking-wide font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mb-1">
            {ETIQUETA_INTENCION[mensaje.intencion] || mensaje.intencion}
          </span>
        )}
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 ${
            mensaje.esError ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{mensaje.contenido}</p>
        </div>
        {mensaje.datos && !mensaje.esError && <DatosResumen datos={mensaje.datos} intencion={mensaje.intencion} />}
      </div>
    </div>
  );
}

/** Muestra cifras clave de forma compacta para dar transparencia a la respuesta. */
function DatosResumen({ datos, intencion }) {
  const chips = [];
  const bs = (v) => `Bs. ${Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
  const litros = (v) => `${Number(v || 0).toLocaleString('es-BO')} L`;

  if (intencion === 'ventas') {
    if (datos.total_recaudado_bs != null) chips.push(['Recaudado', bs(datos.total_recaudado_bs)]);
    if (datos.total_litros != null) chips.push(['Litros', litros(datos.total_litros)]);
    if (datos.cantidad_ventas != null) chips.push(['Ventas', datos.cantidad_ventas]);
  } else if (intencion === 'combustible' && datos.combustible_top) {
    chips.push(['Top', datos.combustible_top.tipo_combustible]);
    chips.push(['Total', bs(datos.combustible_top.total)]);
  } else if (intencion === 'clientes' && datos.cliente_top) {
    chips.push(['Top cliente', datos.cliente_top.cliente]);
    chips.push(['Consumo', bs(datos.cliente_top.total_consumido_bs)]);
  } else if (intencion === 'turnos') {
    if (datos.total_turnos != null) chips.push(['Turnos', datos.total_turnos]);
    if (datos.turnos_abiertos != null) chips.push(['Abiertos', datos.turnos_abiertos]);
  } else if (intencion === 'prediccion' && datos.resumen) {
    if (datos.resumen.total_estimado != null) chips.push(['Estimado', bs(datos.resumen.total_estimado)]);
    if (datos.resumen.tendencia) chips.push(['Tendencia', datos.resumen.tendencia]);
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map(([label, value], i) => (
        <span
          key={i}
          className="text-[11px] bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-600"
        >
          <span className="text-slate-400">{label}:</span>{' '}
          <span className="font-semibold text-slate-700">{value}</span>
        </span>
      ))}
    </div>
  );
}

export default AsistenteIAModule;
