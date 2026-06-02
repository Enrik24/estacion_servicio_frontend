import React, { useState, useEffect } from 'react';
import { prepaidService } from '../../services/prepaidService';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, FileText, Info } from 'lucide-react';

const OrderSuccessStep = ({ orderId }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orders = await prepaidService.getMyOrders();
        const currentOrder = orders.find(o => o.id === orderId);
        
        if (currentOrder) {
          setOrderData(currentOrder);
        } else {
          setError('El pago fue exitoso pero no se pudo cargar la información de la orden. Por favor revisa tu historial.');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('No se pudo cargar el detalle de la orden. Intenta refrescar o revisa tu historial.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await prepaidService.downloadPDF(orderId);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error al descargar el comprobante. Por favor, intenta desde el historial de órdenes.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 font-medium">Recuperando tu comprobante seguro...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-center max-w-2xl mx-auto">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 rounded-full">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-slate-900 mb-4">¡Pago Exitoso!</h2>
      <p className="text-slate-600 mb-8 text-lg">Tu compra ha sido procesada correctamente.</p>

      {error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md mb-8 inline-block text-left">
          <p className="text-amber-700">{error}</p>
        </div>
      )}
      
      {orderData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText className="w-24 h-24" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-4 relative z-10">
            Resumen de la Orden
          </h3>
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Nº de Orden:</span>
              <span className="font-mono font-bold text-slate-800">{orderData.numero_orden}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Combustible:</span>
              <span className="font-semibold text-slate-800">{orderData.tipo_combustible_nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Cantidad:</span>
              <span className="font-semibold text-slate-800">{orderData.litros} Lt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Total Pagado:</span>
              <span className="font-bold text-orange-600">Bs. {orderData.monto_total}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full flex items-center justify-center py-3 bg-orange-100 text-orange-600 font-bold rounded-xl hover:bg-orange-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600 mr-2"></div>
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              {downloading ? 'Descargando...' : 'Descargar Comprobante PDF'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-left flex gap-3 text-blue-800">
        <Info className="w-6 h-6 flex-shrink-0" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">Instrucciones de Retiro:</p>
          <ul className="list-disc pl-5">
            <li>Tu orden es válida por <strong>24 horas</strong>.</li>
            <li>Puedes ir a <strong>cualquier estación de servicio</strong> de la red.</li>
            <li>Debes presentar tu <strong>Carnet de Identidad</strong> al operador para validar el despacho.</li>
            <li>El comprobante también ha sido enviado a tu correo electrónico.</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button 
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg" 
          onClick={() => navigate('/')}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessStep;
