import React, { useState, useEffect } from 'react';
import { ShoppingBag, FileText, Calendar, Clock, Download, CheckCircle, Clock3 } from 'lucide-react';
import { prepaidService } from '../services/prepaidService';
import Header from '../components/layout/Header';
import Swal from 'sweetalert2';

const MisComprasPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await prepaidService.getMyOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar tus compras. Intenta nuevamente más tarde.',
        confirmButtonColor: '#f97316'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (order) => {
    const estado = order.estado?.toUpperCase();
    
    if (estado === 'PENDIENTE') {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'La factura se creará cuando el estado sea PAGADO o DESPACHADO',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const orderId = order.id || order.numero_orden;
    try {
      await prepaidService.downloadPDF(orderId);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al descargar el comprobante.',
        confirmButtonColor: '#f97316'
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Clock3 className="w-3 h-3" /> Pendiente
          </span>
        );
      case 'COMPLETADA':
      case 'PAGADO':
      case 'COMPLETADO':
      case 'DESPACHADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showUserMenu={true} />
      
      <main className="max-w-5xl mx-auto pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mis Compras</h1>
            <p className="mt-1 text-slate-600">Historial de tus órdenes de compra anticipada de combustible.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Aún no tienes compras</h3>
            <p className="mt-2 text-slate-500">Tus compras de combustible prepago aparecerán aquí.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Orden / Fecha
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Comprobante
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {orders.map((order) => (
                    <tr key={order.id || order.numero_orden} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            #{order.numero_orden || order.id}
                          </span>
                          <span className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.fecha_creacion || order.fecha)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900 font-medium">
                            {order.tipo_combustible_nombre || order.tipo_combustible || 'Combustible'}
                          </span>
                          <span className="text-sm text-slate-500">
                            {order.litros} Litros
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">
                          Bs. {order.monto_total}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownload(order)}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MisComprasPage;
