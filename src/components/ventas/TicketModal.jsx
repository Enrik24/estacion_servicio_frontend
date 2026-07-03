import React, { useRef } from 'react';
import { X, Printer, Fuel, MapPin, User, Hash, CreditCard } from 'lucide-react';

const TicketModal = ({ ticket, onClose }) => {
    const printRef = useRef(null);

    if (!ticket) return null;

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Ticket de Venta</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; font-size: 14px; }
                        .ticket-container { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px dashed #ccc; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .mb-2 { margin-bottom: 8px; }
                        .mb-4 { margin-bottom: 16px; }
                        .divider { border-top: 1px dashed #000; margin: 15px 0; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .text-sm { font-size: 12px; }
                        .text-xs { font-size: 10px; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const formatearFecha = (fechaString) => {
        const opciones = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(fechaString).toLocaleDateString('es-BO', opciones);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header Action */}
                <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Fuel className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-sm tracking-wide">COMPROBANTE DE VENTA</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-300 hover:text-white" />
                    </button>
                </div>

                {/* Ticket Content Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#f9fafb]">
                    <div 
                        ref={printRef} 
                        className="bg-white p-6 shadow-sm border border-gray-100 rounded-lg relative"
                        style={{ fontFamily: "'Courier New', Courier, monospace" }}
                    >
                        {/* Decorative top sawtooth */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmOWZhZmIiIHBvaW50cz0iMCwwIDgsMCA0LDgiLz48L3N2Zz4=')] repeat-x bg-[length:8px_8px]"></div>

                        <div className="text-center mb-6 mt-2">
                            <h2 className="font-bold text-xl uppercase tracking-wider text-slate-800">{ticket.sucursal?.nombre}</h2>
                            <p className="text-xs text-gray-600 mt-1">{ticket.sucursal?.direccion}</p>
                            <div className="text-xs text-gray-500 mt-1 flex justify-center gap-3">
                                <span>NIT: {ticket.sucursal?.nit}</span>
                                <span>Tel: {ticket.sucursal?.telefono}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-gray-300 my-4"></div>

                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Recibo Nro:</span>
                                <span className="font-bold text-slate-900">{ticket.comprobante?.numero}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fecha:</span>
                                <span>{formatearFecha(ticket.comprobante?.fecha_hora)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Estado:</span>
                                <span className="font-bold text-emerald-600">{ticket.comprobante?.estado}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-gray-300 my-4"></div>

                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span>Cliente:</span>
                                <span className="text-right max-w-[180px] font-medium">{ticket.cliente?.nombre || 'Consumidor Final'}</span>
                            </div>
                            {ticket.cliente?.nit && (
                                <div className="flex justify-between">
                                    <span>NIT/CI:</span>
                                    <span>{ticket.cliente?.nit}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Método de Pago:</span>
                                <span className="uppercase font-medium">{ticket.pago?.metodo}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-gray-300 my-4"></div>

                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span>Despacho:</span>
                                <span>Isla {ticket.despacho?.isla} - Lado {ticket.despacho?.lado}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Operador:</span>
                                <span>{ticket.operador?.nombre}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-gray-300 my-4"></div>

                        <div className="mb-4">
                            <div className="flex justify-between font-bold text-slate-800 border-b border-gray-200 pb-2 mb-2 text-sm">
                                <span>Producto</span>
                                <span>Importe</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-700">
                                <div>
                                    <p className="font-semibold text-slate-900">{ticket.combustible?.tipo}</p>
                                    <p className="text-xs text-gray-500 mt-1">{ticket.combustible?.litros} Lt x Bs. {ticket.combustible?.precio_unitario}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold">Bs. {ticket.combustible?.total}</span>
                                </div>
                            </div>
                        </div>

                        {ticket.puntos && ticket.puntos.canjeados > 0 && (
                            <>
                                <div className="border-t border-dashed border-gray-300 my-4"></div>
                                <div className="flex justify-between text-sm text-amber-700">
                                    <span>Descuento por canje ({ticket.puntos.canjeados} pts):</span>
                                    <span className="font-semibold">− Bs. {ticket.puntos.descuento_bs}</span>
                                </div>
                            </>
                        )}

                        <div className="border-t-2 border-slate-800 my-4"></div>

                        <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                            <span>TOTAL:</span>
                            <span>Bs. {ticket.combustible?.total}</span>
                        </div>

                        {ticket.puntos && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
                                <div className="flex items-center justify-between font-semibold text-amber-800 mb-2">
                                    <span>PROGRAMA DE PUNTOS</span>
                                </div>
                                {ticket.puntos.ganados > 0 && (
                                    <div className="flex justify-between text-amber-700">
                                        <span>Puntos ganados en esta compra:</span>
                                        <span className="font-bold">+{ticket.puntos.ganados}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-amber-900 mt-1 pt-1 border-t border-amber-200">
                                    <span className="font-semibold">Saldo actual:</span>
                                    <span className="font-bold">{ticket.puntos.saldo_actual} pts</span>
                                </div>
                            </div>
                        )}

                        <div className="text-center mt-8 text-xs text-gray-500">
                            <p>¡Gracias por su preferencia!</p>
                            <p className="mt-1">Vuelva pronto</p>
                        </div>
                        
                         {/* Decorative bottom sawtooth */}
                         <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmOWZhZmIiIHBvaW50cz0iMCw4IDgsOCA0LDAiLz48L3N2Zz4=')] repeat-x bg-[length:8px_8px]"></div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                    >
                        Cerrar
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2 shadow-md shadow-slate-900/20"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketModal;
