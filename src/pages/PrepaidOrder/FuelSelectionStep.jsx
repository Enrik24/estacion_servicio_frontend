import React, { useState, useEffect } from 'react';
import FuelCard from '../../components/FuelCard';
import { preciosCombustibleService } from '../../services/ventasService';
import { Info, Fuel, Banknote, ArrowRight } from 'lucide-react';

const FuelSelectionStep = ({ onNext }) => {
  const [fuels, setFuels] = useState([]);
  const [selectedFuelId, setSelectedFuelId] = useState(null);
  const [amountBs, setAmountBs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await preciosCombustibleService.getAll();
        const fuelsData = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setFuels(fuelsData);
        if (fuelsData.length > 0) setSelectedFuelId(fuelsData[0].id);
      } catch (err) {
        console.error('[FuelSelectionStep] Error al cargar combustibles:', err);
        setError('Error al cargar datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedFuel = fuels.find(f => f.id === selectedFuelId);
  const liters = selectedFuel && amountBs
    ? (parseFloat(amountBs) / parseFloat(selectedFuel.precio_unitario)).toFixed(2)
    : '0.00';

  const handleNext = () => {
    if (!selectedFuelId || !amountBs || parseFloat(amountBs) <= 0) {
      setError('Por favor completa todos los campos correctamente.');
      return;
    }
    setError('');
    onNext({
      tipo_combustible_id: selectedFuelId,
      monto_total: parseFloat(amountBs),
      litros: parseFloat(liters),
      fuelDetails: selectedFuel
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
                <p className="text-red-700">{error}</p>
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                        <h3 className="text-lg font-bold text-slate-800">Detalles de la Carga</h3>
                    </div>
                    <div className="p-6 space-y-8">

                        {/* Fuel Selection */}
                        <div className="space-y-3">
                            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Fuel className="w-4 h-4 mr-2" />
                                Selecciona el Tipo de Combustible
                            </label>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {fuels.map(fuel => (
                                    <FuelCard 
                                        key={fuel.codigo}
                                        fuel={fuel}
                                        selected={selectedFuelId === fuel.id}
                                        onClick={() => setSelectedFuelId(fuel.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Banknote className="w-4 h-4 mr-2" />
                                Ingresa el Monto a Comprar (Bs)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 font-bold">Bs.</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-slate-900 font-bold text-lg" 
                                    placeholder="100" 
                                    value={amountBs}
                                    onChange={(e) => setAmountBs(e.target.value)}
                                    min="1"
                                    step="0.5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="bg-[#f8faff] border-l-[3px] border-orange-600 rounded-r-xl p-5 flex items-start gap-4 shadow-sm border-t border-r border-b border-slate-200">
                    <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[13px] font-semibold text-slate-800 mb-0.5">Información Importante</h4>
                        <p className="text-[13px] text-slate-600">El comprobante de pago generado tendrá una validez de 24 horas después del pago exitoso.</p>
                    </div>
                </div>
            </div>

            {/* Right Column (Summary) */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[380px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Resumen de Compra</h3>
                    
                    <div className="space-y-4 mb-6 flex-grow">
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-slate-500">Tipo:</span>
                            <span className="font-semibold text-slate-800">{selectedFuel?.nombre || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] pb-4 border-b border-slate-100">
                            <span className="text-slate-500">Precio Unitario:</span>
                            <span className="font-semibold text-slate-800">Bs. {selectedFuel?.precio_unitario || '0.00'} / {selectedFuel?.unidad || 'Lt'}</span>
                        </div>
                        
                        <div className="bg-[#eff5ff] rounded-xl p-4 text-center border border-blue-50 mt-6">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Equivalente Estimado</p>
                            <p className="text-2xl font-extrabold text-slate-800 mb-1">≈ {liters} {selectedFuel?.unidad || 'Lt'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Cálculo basado en el precio oficial vigente.</p>
                        </div>
                    </div>

                    <div className="mt-auto space-y-5">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 text-[15px]">Total a Pagar</span>
                            <span className="text-2xl font-extrabold text-[#f97316]">Bs. {amountBs ? parseFloat(amountBs).toFixed(2) : '0.00'}</span>
                        </div>
                        
                        <button 
                            className="w-full flex items-center justify-center py-3 bg-[#f97316] text-white font-bold rounded-lg shadow-sm hover:bg-[#ea580c] transition-all"
                            onClick={handleNext}
                        >
                            Continuar al Pago
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                        
                        <button className="w-full text-center text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
                            Cancelar operación
                        </button>
                    </div>
                </div>

                {/* Aesthetic Image Card */}
                <div className="relative rounded-xl overflow-hidden shadow-sm h-[130px] group">
                    <img src="/gas_station_bg.png" alt="Surtidor" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-4">
                        <h4 className="text-white font-bold text-[13px]">Surtidor Bolivia</h4>
                        <p className="text-slate-300 text-[11px] mt-0.5 font-medium">Energía confiable para tu camino.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FuelSelectionStep;
