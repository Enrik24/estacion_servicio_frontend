import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';

const StripePaymentForm = ({ clientSecret, onPaymentSuccess, onPaymentError, isProcessing, setIsProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      }
    });

    if (result.error) {
      onPaymentError(result.error.message);
      setIsProcessing(false);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        onPaymentSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Información de la Tarjeta</label>
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1e293b',
                fontFamily: 'Inter, system-ui, sans-serif',
                '::placeholder': {
                  color: '#94a3b8',
                },
              },
              invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
              },
            },
          }} />
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className={`w-full py-4 text-white text-lg font-bold rounded-xl shadow-md transition-all flex items-center justify-center ${
          !stripe || isProcessing 
            ? 'bg-slate-400 cursor-not-allowed' 
            : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-lg'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </div>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Pagar Ahora
          </>
        )}
      </button>
      
      <div className="text-center mt-4">
        <p className="text-xs text-slate-500 flex items-center justify-center">
          <Lock className="w-3 h-3 mr-1" /> Pago procesado de forma segura por Stripe
        </p>
      </div>
    </form>
  );
};

export default StripePaymentForm;
