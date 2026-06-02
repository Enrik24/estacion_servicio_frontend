import { useState } from "react";
import EstadoBadge from "./EstadoBadge";
import { AlertTriangle, CheckCircle, Power } from "lucide-react";

function IslaCard({ isla, onCambiarEstado }) {
  const [showModal, setShowModal] = useState(false);
  const [ladoSeleccionado, setLadoSeleccionado] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  const abrirModal = (lado, estado) => {
    setLadoSeleccionado(lado);
    setNuevoEstado(estado);
    setDescripcion("");
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
        {isla.lados.map((lado) => {
          const isRemoto = lado.estado === "AUTORIZADO_REMOTO";

          return (
            <div
              key={lado.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300 border ${
                isRemoto
                  ? "bg-blue-50/40 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)] animate-pulse"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              {/* Información Izquierda del Surtidor */}
              <div class="flex items-center gap-3">
                <span
                  className={`text-sm font-bold ${isRemoto ? "text-blue-900" : "text-slate-700"}`}
                >
                  Lado {lado.lado}
                </span>
                <EstadoBadge estado={lado.estado} />

                {/* Pequeño indicador de placa si está autorizado remotamente */}
                {isRemoto && lado.placa_activa && (
                  <span class="text-[11px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    🚗 {lado.placa_activa}
                  </span>
                )}
              </div>

              {/* Acciones y Botones de Control (Asimetría por Roles) */}
              <div class="flex items-center gap-1">
                {/* SI EL SURTIDOR ESTÁ EN FLUJO IoT AUTOMÁTICO */}
                {isRemoto ? (
                  <>
                    {/* Botón para abrir el panel lateral de auditoría del cliente */}
                    <button
                      onClick={() => seleccionarSurtidorActivo(lado)} // Función para cargar los detalles en tu columna derecha
                      class="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                      title="Ver Auditoría de Cuenta LPR"
                    >
                      <i data-lucide="eye" class="w-4 h-4"></i>{" "}
                      {/* Puedes cambiarlo por tu icono de Lucide <Eye /> */}
                    </button>

                    {/* Botón de pánico para cancelar la autorización y devolverlo a ACTIVO */}
                    <button
                      onClick={() =>
                        handleCambiarEstado(
                          lado.id,
                          "ACTIVO",
                          "Cancelación manual de orden remota",
                        )
                      }
                      class="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                      title="Cancelar Autorización de Despacho"
                    >
                      <i data-lucide="x-circle" class="w-4 h-4"></i>{" "}
                      {/* <XCircle /> */}
                    </button>
                  </>
                ) : (
                  /* FLUJO DE CONTROL MANUAL TRADICIONAL */
                  <>
                    {lado.estado !== "ACTIVO" && (
                      <button
                        onClick={() => abrirModal(lado, "ACTIVO")}
                        class="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
                        title="Marcar como activo"
                      >
                        <CheckCircle class="w-4 h-4" />
                      </button>
                    )}
                    {lado.estado !== "INACTIVO" && (
                      <button
                        onClick={() => abrirModal(lado, "INACTIVO")}
                        class="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                        title="Marcar como inactivo"
                      >
                        <Power class="w-4 h-4" />
                      </button>
                    )}
                    {lado.estado !== "FALLA" && (
                      <button
                        onClick={() => abrirModal(lado, "FALLA")}
                        class="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                        title="Reportar falla"
                      >
                        <AlertTriangle class="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900">
              {nuevoEstado === "FALLA"
                ? "⚠️ Reportar Falla"
                : nuevoEstado === "INACTIVO"
                  ? "Desactivar Surtidor"
                  : "✅ Activar Surtidor"}
            </h3>
            <p className="text-sm text-gray-600">
              Isla {isla.numero} — Lado {ladoSeleccionado?.lado}
            </p>
            {(nuevoEstado === "FALLA" || nuevoEstado === "INACTIVO") && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  {nuevoEstado === "FALLA"
                    ? "Descripción de la falla"
                    : "Motivo"}
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  rows={3}
                  placeholder={
                    nuevoEstado === "FALLA"
                      ? "Describe la falla..."
                      : "Motivo de desactivación..."
                  }
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmar}
                disabled={loading}
                className={`flex-1 py-2 px-4 rounded-lg text-white text-sm font-semibold transition ${
                  nuevoEstado === "FALLA"
                    ? "bg-red-600 hover:bg-red-700"
                    : nuevoEstado === "INACTIVO"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:opacity-50`}
              >
                {loading ? "Guardando..." : "Confirmar"}
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
