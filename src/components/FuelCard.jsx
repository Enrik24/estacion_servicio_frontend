import React from 'react';

const FuelCard = ({ fuel, selected, onClick }) => {
  // Separar el nombre (ej. "Gasolina Especial" -> "Gasolina" y "Especial")
  const parts = (fuel.nombre || '').split(' ');
  const mainName = parts[0];
  const subName = parts.slice(1).join(' ');

  // Formatear unidad (ej. litro -> Lt, m3 -> m³)
  let unidadDisplay = fuel.unidad || 'Lt';
  const unidadLower = unidadDisplay.toLowerCase();
  if (unidadLower.includes('litro') || unidadLower === 'lt') {
    unidadDisplay = 'Lt';
  } else if (unidadLower.includes('m3') || unidadLower.includes('cubico')) {
    unidadDisplay = 'm³';
  }

  return (
    <div 
      className={`relative bg-white rounded-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-center hover:shadow-md hover:-translate-y-1 ${
        selected ? 'border-2 border-[#f97316] shadow-sm' : 'border border-slate-200 shadow-sm hover:border-orange-300'
      }`} 
      onClick={onClick}
    >
      <div>
        <h3 className="text-lg font-bold text-slate-800 leading-tight">{mainName}</h3>
        <p className="text-[13px] text-slate-500 mb-6">{subName || '\u00A0'}</p>
        <p className="text-[14px] font-bold text-[#f97316]">
          Bs. {fuel.precio_unitario} / {unidadDisplay}
        </p>
      </div>
    </div>
  );
};

export default FuelCard;
