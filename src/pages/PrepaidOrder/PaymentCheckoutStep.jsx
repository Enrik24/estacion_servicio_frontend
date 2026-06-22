import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../../components/StripePaymentForm';
import { prepaidService } from '../../services/prepaidService';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_tu_clave_de_pruebas_aqui");

const PaymentCheckoutStep = ({ orderData, onPaymentSuccess, onBack }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const createOrder = async () => {
      try {
        setLoading(true);
        const data = await prepaidService.createPrepaidOrder({
          tipo_combustible_id: orderData.tipo_combustible_id,
          monto_total: orderData.monto_total,
        });
        
        setClientSecret(data.client_secret);
        setOrderId(data.orden_id);
      } catch (err) {
        console.error('Error creating order:', err);
        setError('No se pudo inicializar el pago. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (orderData) {
      createOrder();
    }
  }, [orderData]);

  const handlePaymentSuccess = () => {
    onPaymentSuccess(orderId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 font-medium">Preparando tu orden segura...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 inline-block text-left">
          <p className="text-red-700">{error}</p>
        </div>
        <div>
          <button 
            className="flex items-center justify-center mx-auto text-slate-600 hover:text-orange-500 font-medium transition-colors" 
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Resumen */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
          <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">Resumen de la Orden</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Combustible:</span>
              <span className="text-slate-800 font-semibold">{orderData.fuelDetails?.nombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Cantidad Estimada:</span>
              <span className="text-slate-800 font-semibold">{orderData.litros} {orderData.fuelDetails?.unidad || 'Lt'}</span>
            </div>
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center mt-2">
              <span className="text-slate-800 font-bold text-lg">Total a Pagar:</span>
              <span className="text-orange-600 font-extrabold text-2xl">Bs. {orderData.monto_total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pago */}
        <div>
          <div className="flex items-center mb-6">
            <ShieldCheck className="w-6 h-6 text-green-500 mr-2" />
            <h4 className="text-xl font-bold text-slate-800">Detalles de Pago Seguro</h4>
          </div>
          
          {clientSecret && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm 
                  clientSecret={clientSecret}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={(msg) => setError(msg)}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </Elements>
            </div>
          )}

          {!isProcessing && (
            <button 
              className="mt-6 flex items-center justify-center w-full py-3 text-slate-500 hover:text-slate-800 font-medium hover:bg-slate-50 rounded-xl transition-colors" 
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver y editar orden
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckoutStep;
