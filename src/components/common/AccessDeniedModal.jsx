import { AlertCircle, Mail } from 'lucide-react';
import Modal from './Modal';

/**
 * Componente para mostrar errores de acceso denegado (403 Forbidden)
 */
function AccessDeniedModal({ isOpen, onClose, titulo = "Acceso Denegado" }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-2">
              No tienes permisos para esta acción
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Tu usuario actual no tiene los permisos necesarios para acceder a este recurso. 
              Si crees que esto es un error, contacta al administrador del sistema.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">📧 Contactar Administrador</p>
          <p className="text-sm text-blue-800">
            Si necesitas acceso a esta funcionalidad, solicítalo a tu administrador del sistema.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AccessDeniedModal;
