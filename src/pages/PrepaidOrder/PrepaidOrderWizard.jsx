import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FuelSelectionStep from './FuelSelectionStep';
import PaymentCheckoutStep from './PaymentCheckoutStep';
import OrderSuccessStep from './OrderSuccessStep';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const PrepaidOrderWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState(null);
  const [completedOrderId, setCompletedOrderId] = useState(null);
  const navigate = useNavigate();

  const handleFuelSelectionNext = (data) => {
    setOrderData(data);
    setCurrentStep(2);
  };

  const handlePaymentSuccess = (orderId) => {
    setCompletedOrderId(orderId);
    setCurrentStep(3);
  };

  const handleBackToSelection = () => {
    setCurrentStep(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        showNav 
        showUserMenu 
        variant="dark"
        onLogout={handleLogout}
      />

      <main className="flex-grow pt-28 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-10 text-center text-white">
              <h2 className="text-3xl font-extrabold mb-2">Compra Prepago de Combustible</h2>
              <p className="text-slate-300 text-lg">Asegura tu carga comprando con anticipación</p>
            </div>
            
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200">
              <div className="flex justify-between items-center max-w-2xl mx-auto relative">
                <div className={`relative z-10 flex flex-col items-center ${currentStep >= 1 ? 'text-orange-500' : 'text-slate-400'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm ${currentStep >= 1 ? 'bg-orange-500 text-white' : 'bg-white border-2 border-slate-300 text-slate-400'}`}>1</div>
                  <span className="text-sm font-semibold">Selección</span>
                </div>
                <div className={`absolute top-6 left-0 right-0 h-1 -z-0 ${currentStep > 1 ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                <div className={`relative z-10 flex flex-col items-center ${currentStep >= 2 ? 'text-orange-500' : 'text-slate-400'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm ${currentStep >= 2 ? 'bg-orange-500 text-white' : 'bg-white border-2 border-slate-300 text-slate-400'}`}>2</div>
                  <span className="text-sm font-semibold">Pago</span>
                </div>
                <div className={`absolute top-6 left-1/2 right-0 h-1 -z-0 ${currentStep > 2 ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                <div className={`relative z-10 flex flex-col items-center ${currentStep >= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm ${currentStep >= 3 ? 'bg-orange-500 text-white' : 'bg-white border-2 border-slate-300 text-slate-400'}`}>3</div>
                  <span className="text-sm font-semibold">Comprobante</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              {currentStep === 1 && (
                <FuelSelectionStep onNext={handleFuelSelectionNext} />
              )}
              {currentStep === 2 && (
                <PaymentCheckoutStep 
                  orderData={orderData} 
                  onPaymentSuccess={handlePaymentSuccess} 
                  onBack={handleBackToSelection}
                />
              )}
              {currentStep === 3 && (
                <OrderSuccessStep orderId={completedOrderId} />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer variant="dark" />
    </div>
  );
};

export default PrepaidOrderWizard;
