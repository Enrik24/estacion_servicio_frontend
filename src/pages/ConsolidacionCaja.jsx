import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import consolidacionService from '../services/consolidacionService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const ConsolidacionCaja = () => {
  const [data, setData] = useState({ indicadores: {}, tabla: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consolidating, setConsolidating] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await consolidacionService.getResumen();
      console.log('📤 Respuesta completa del backend:', result);
      
      // Extraer datos del response
      let processedData = { indicadores: {}, tabla: [] };
      
      // Si result es un objeto con propiedades
      if (result && typeof result === 'object') {
        // Buscar indicadores
        if (result.indicadores) {
          processedData.indicadores = result.indicadores;
          console.log('✅ Indicadores encontrados:', result.indicadores);
        }
        
        // Buscar tabla - puede estar en diferentes ubicaciones
        let tableData = [];
        if (result.tabla && Array.isArray(result.tabla)) {
          tableData = result.tabla;
          console.log('✅ Tabla encontrada en result.tabla');
        } else if (result.data && Array.isArray(result.data)) {
          tableData = result.data;
          console.log('✅ Tabla encontrada en result.data');
        } else if (result.results && Array.isArray(result.results)) {
          tableData = result.results;
          console.log('✅ Tabla encontrada en result.results');
        } else if (Array.isArray(result)) {
          tableData = result;
          console.log('✅ Result es un array directo');
        }
        
        processedData.tabla = tableData;
        console.log(`✅ Total de turnos: ${tableData.length}`, tableData);
      }
      
      setData(processedData);
      
      // Validar que se cargaron datos
      if (processedData.tabla.length === 0) {
        console.warn('⚠️ No hay turnos pendientes o no se encontraron datos');
      }
      
    } catch (err) {
      console.error('❌ Error al cargar consolidación:', err);
      console.error('📥 Detalles del error:', err.response?.data);
      setError(err.response?.data?.detail || err.message || 'No se pudieron cargar los datos de consolidación');
      toast.error("Error al cargar datos de consolidación");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleConsolidar = async (id) => {
    if (!window.confirm("¿Está seguro de consolidar esta caja? Esta acción se registrará en bitácora.")) return;
    
    try {
      setConsolidating(id);
      console.log(`🔄 Consolidando turno ${id}...`);
      
      await consolidacionService.consolidarTurno(id);
      
      console.log(`✅ Turno ${id} consolidado exitosamente`);
      toast.success("Turno consolidado exitosamente");
      
      // Esperar un segundo y luego recargar
      setTimeout(() => {
        fetchData();
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error al consolidar:', err);
      console.error('📥 Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.detail || 
                          err.response?.data?.error ||
                          "Error al consolidar el turno";
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setConsolidating(null);
    }
  };

  // Calcular totales por método de pago
  const calcularTotales = () => {
    const ventaTotal = data.tabla.reduce((sum, turno) => sum + (turno.monto_sistema || turno.total || 0), 0);
    const diferenciaTotalMonto = data.tabla.reduce((sum, turno) => sum + (turno.diferencia || 0), 0);
    
    // Calcular totales por método de pago
    const metodosPago = {
      efectivo: 0,
      tarjeta: 0,
      qr: 0,
      credito_fleet: 0
    };

    // Calcular totales por tipo de combustible
    const tiposCombustible = {
      gasolina_especial: 0,
      gasolina_premium: 0,
      diesel: 0,
      gnv: 0
    };

    data.tabla.forEach(turno => {
      if (turno.metodos_pago && typeof turno.metodos_pago === 'object') {
        // Si es un objeto con propiedades
        metodosPago.efectivo += turno.metodos_pago.efectivo || turno.metodos_pago.EFECTIVO || 0;
        metodosPago.tarjeta += turno.metodos_pago.tarjeta || turno.metodos_pago.TARJETA || 0;
        metodosPago.qr += turno.metodos_pago.qr || turno.metodos_pago.QR || 0;
        metodosPago.credito_fleet += turno.metodos_pago.credito_fleet || turno.metodos_pago.CREDITO_FLEET || 0;
      }

      if (turno.tipos_combustible && typeof turno.tipos_combustible === 'object') {
        tiposCombustible.gasolina_especial += turno.tipos_combustible.gasolina_especial || turno.tipos_combustible.GASOLINA_ESPECIAL || 0;
        tiposCombustible.gasolina_premium += turno.tipos_combustible.gasolina_premium || turno.tipos_combustible.GASOLINA_PREMIUM || 0;
        tiposCombustible.diesel += turno.tipos_combustible.diesel || turno.tipos_combustible.DIESEL || 0;
        tiposCombustible.gnv += turno.tipos_combustible.gnv || turno.tipos_combustible.GNV || 0;
      }
    });

    return {
      ventaTotal: ventaTotal.toFixed(2),
      diferenciaTotalMonto: diferenciaTotalMonto.toFixed(2),
      efectivo: metodosPago.efectivo.toFixed(2),
      tarjeta: metodosPago.tarjeta.toFixed(2),
      qr: metodosPago.qr.toFixed(2),
      credito_fleet: metodosPago.credito_fleet.toFixed(2),
      gasolina_especial: tiposCombustible.gasolina_especial.toFixed(2),
      gasolina_premium: tiposCombustible.gasolina_premium.toFixed(2),
      diesel: tiposCombustible.diesel.toFixed(2),
      gnv: tiposCombustible.gnv.toFixed(2)
    };
  };

  const totales = calcularTotales();
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

  // Función para exportar a Excel
  const exportarExcel = () => {
    try {
      // Preparar datos para Excel
      const excelData = data.tabla.map(turno => ({
        'Operador': turno.operador_nombre || turno.operador || 'N/A',
        'Sucursal': turno.ubicacion || turno.sucursal_nombre || turno.sucursal || 'N/A',
        'Efectivo (Bs)': typeof turno.metodos_pago?.efectivo === 'number' ? turno.metodos_pago.efectivo.toFixed(2) : '0.00',
        'Tarjeta (Bs)': typeof turno.metodos_pago?.tarjeta === 'number' ? turno.metodos_pago.tarjeta.toFixed(2) : '0.00',
        'QR (Bs)': typeof turno.metodos_pago?.qr === 'number' ? turno.metodos_pago.qr.toFixed(2) : '0.00',
        'Crédito Fleet (Bs)': typeof turno.metodos_pago?.credito_fleet === 'number' ? turno.metodos_pago.credito_fleet.toFixed(2) : '0.00',
        'Gasolina Especial (Bs)': typeof turno.tipos_combustible?.gasolina_especial === 'number' ? turno.tipos_combustible.gasolina_especial.toFixed(2) : '0.00',
        'Gasolina Premium (Bs)': typeof turno.tipos_combustible?.gasolina_premium === 'number' ? turno.tipos_combustible.gasolina_premium.toFixed(2) : '0.00',
        'Diésel (Bs)': typeof turno.tipos_combustible?.diesel === 'number' ? turno.tipos_combustible.diesel.toFixed(2) : '0.00',
        'GNV (Bs)': typeof turno.tipos_combustible?.gnv === 'number' ? turno.tipos_combustible.gnv.toFixed(2) : '0.00',
        'Diferencia (Bs)': typeof turno.diferencia === 'number' ? turno.diferencia.toFixed(2) : '0.00',
        'Monto Sistema (Bs)': typeof turno.monto_sistema === 'number' ? turno.monto_sistema.toFixed(2) : '0.00',
      }));

      // Agregar totales al final
      excelData.push({
        'Operador': 'TOTAL',
        'Sucursal': '',
        'Efectivo (Bs)': totales.efectivo,
        'Tarjeta (Bs)': totales.tarjeta,
        'QR (Bs)': totales.qr,
        'Crédito Fleet (Bs)': totales.credito_fleet,
        'Gasolina Especial (Bs)': totales.gasolina_especial,
        'Gasolina Premium (Bs)': totales.gasolina_premium,
        'Diésel (Bs)': totales.diesel,
        'GNV (Bs)': totales.gnv,
        'Diferencia (Bs)': totales.diferenciaTotalMonto,
        'Monto Sistema (Bs)': totales.ventaTotal,
      });

      // Crear workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Consolidación Caja');

      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 25 },
        { wch: 25 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 20 },
        { wch: 22 },
        { wch: 22 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 }
      ];

      // Descargar archivo
      const filename = `Consolidacion_Caja_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Excel exportado correctamente');
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      toast.error('Error al exportar a Excel');
    }
  };

  // Función para exportar a PDF
  const exportarPDF = async () => {
    try {
      if (!data.tabla || data.tabla.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Título
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('CONSOLIDACIÓN DE CAJA', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;

      // Información general
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Fecha: ${hoy}`, 15, yPosition);
      yPosition += 7;
      pdf.text(`Total Facturas: ${data.indicadores?.total_facturas ?? 0}`, 15, yPosition);
      yPosition += 7;
      pdf.text(`Venta Total (Sistema): Bs. ${totales.ventaTotal}`, 15, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(9);
      pdf.text(`Desglose por Método de Pago:`, 15, yPosition);
      yPosition += 4;
      pdf.text(`  • Efectivo: Bs. ${totales.efectivo}`, 15, yPosition);
      yPosition += 3;
      pdf.text(`  • Tarjeta: Bs. ${totales.tarjeta}`, 15, yPosition);
      yPosition += 3;
      pdf.text(`  • QR: Bs. ${totales.qr}`, 15, yPosition);
      yPosition += 3;
      pdf.text(`  • Crédito Fleet: Bs. ${totales.credito_fleet}`, 15, yPosition);
      yPosition += 5;
      
      pdf.text(`Desglose por Tipo de Combustible:`, 15, yPosition);
      yPosition += 4;
      pdf.text(`  • Gasolina Especial: Bs. ${totales.gasolina_especial}`, 15, yPosition);
      yPosition += 3;
      pdf.text(`  • Gasolina Premium: Bs. ${totales.gasolina_premium}`, 15, yPosition);
      yPosition += 3;
      pdf.text(`  • Diésel: Bs. ${totales.diesel}`, 15, yPosition);
      yPosition += 3;
      pdf.text(`  • GNV: Bs. ${totales.gnv}`, 15, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(10);
      pdf.text(`Diferencia Total: Bs. ${totales.diferenciaTotalMonto}`, 15, yPosition);
      yPosition += 7;
      pdf.text(`Turnos Pendientes: ${data.tabla.length}`, 15, yPosition);
      yPosition += 15;

      // Encabezados de tabla
      const columns = [
        { header: 'Operador', dataKey: 'operador', width: 22 },
        { header: 'Sucursal', dataKey: 'sucursal', width: 22 },
        { header: 'Efectivo', dataKey: 'efectivo', width: 12 },
        { header: 'Tarjeta', dataKey: 'tarjeta', width: 12 },
        { header: 'QR', dataKey: 'qr', width: 10 },
        { header: 'Fleet', dataKey: 'fleet', width: 10 },
        { header: 'G.Esp', dataKey: 'gesp', width: 10 },
        { header: 'G.Prem', dataKey: 'gprem', width: 10 },
        { header: 'Diésel', dataKey: 'diesel', width: 10 },
        { header: 'GNV', dataKey: 'gnv', width: 10 },
        { header: 'Diferencia', dataKey: 'diferencia', width: 12 },
        { header: 'Monto', dataKey: 'monto', width: 14 }
      ];

      // Preparar datos de tabla
      const tableData = data.tabla.map(turno => ({
        operador: turno.operador_nombre || turno.operador || 'N/A',
        sucursal: turno.ubicacion || turno.sucursal_nombre || turno.sucursal || 'N/A',
        efectivo: typeof turno.metodos_pago?.efectivo === 'number' ? turno.metodos_pago.efectivo.toFixed(2) : '0.00',
        tarjeta: typeof turno.metodos_pago?.tarjeta === 'number' ? turno.metodos_pago.tarjeta.toFixed(2) : '0.00',
        qr: typeof turno.metodos_pago?.qr === 'number' ? turno.metodos_pago.qr.toFixed(2) : '0.00',
        fleet: typeof turno.metodos_pago?.credito_fleet === 'number' ? turno.metodos_pago.credito_fleet.toFixed(2) : '0.00',
        gesp: typeof turno.tipos_combustible?.gasolina_especial === 'number' ? turno.tipos_combustible.gasolina_especial.toFixed(2) : '0.00',
        gprem: typeof turno.tipos_combustible?.gasolina_premium === 'number' ? turno.tipos_combustible.gasolina_premium.toFixed(2) : '0.00',
        diesel: typeof turno.tipos_combustible?.diesel === 'number' ? turno.tipos_combustible.diesel.toFixed(2) : '0.00',
        gnv: typeof turno.tipos_combustible?.gnv === 'number' ? turno.tipos_combustible.gnv.toFixed(2) : '0.00',
        diferencia: typeof turno.diferencia === 'number' ? turno.diferencia.toFixed(2) : '0.00',
        monto: typeof turno.monto_sistema === 'number' ? turno.monto_sistema.toFixed(2) : '0.00'
      }));

      // Dibujar encabezados
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      
      let xPos = 15;
      columns.forEach(col => {
        pdf.text(col.header, xPos, yPosition, { maxWidth: col.width });
        xPos += col.width;
      });
      
      yPosition += 8;

      // Dibujar filas
      pdf.setFont(undefined, 'normal');
      tableData.forEach((row, index) => {
        // Verificar si necesita nueva página
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          
          // Repetir encabezados en nueva página
          pdf.setFont(undefined, 'bold');
          pdf.setFillColor(240, 240, 240);
          xPos = 15;
          columns.forEach(col => {
            pdf.text(col.header, xPos, yPosition, { maxWidth: col.width });
            xPos += col.width;
          });
          yPosition += 8;
          pdf.setFont(undefined, 'normal');
        }

        // Dibujar filas alternadas
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
        } else {
          pdf.setFillColor(255, 255, 255);
        }

        xPos = 15;
        columns.forEach(col => {
          const text = String(row[col.dataKey]);
          pdf.text(text, xPos, yPosition, { maxWidth: col.width });
          xPos += col.width;
        });

        yPosition += 7;
      });

      // Fila de totales
      yPosition += 5;
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(220, 220, 220);
      
      const totalRow = [
        { text: 'TOTAL', width: 22 },
        { text: '', width: 22 },
        { text: totales.efectivo, width: 12 },
        { text: totales.tarjeta, width: 12 },
        { text: totales.qr, width: 10 },
        { text: totales.credito_fleet, width: 10 },
        { text: totales.gasolina_especial, width: 10 },
        { text: totales.gasolina_premium, width: 10 },
        { text: totales.diesel, width: 10 },
        { text: totales.gnv, width: 10 },
        { text: totales.diferenciaTotalMonto, width: 12 },
        { text: totales.ventaTotal, width: 14 }
      ];

      xPos = 15;
      totalRow.forEach(col => {
        pdf.text(col.text, xPos, yPosition, { maxWidth: col.width });
        xPos += col.width;
      });

      // Pie de página
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 15, pageHeight - 10);

      // Descargar PDF
      const filename = `Consolidacion_Caja_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`;
      pdf.save(filename);
      toast.success('PDF exportado correctamente');
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      toast.error('Error al exportar a PDF');
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p>Cargando datos de consolidación...</p>
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            
            {/* Indicadores - Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Venta Total (Sistema)</p>
                <h3 className="text-2xl font-bold">Bs. {totales.ventaTotal}</h3>
                <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
                  <p className="font-semibold text-slate-600 mb-1">Métodos de Pago:</p>
                  <p>Efectivo: Bs. {totales.efectivo}</p>
                  <p>Tarjeta: Bs. {totales.tarjeta}</p>
                  <p>QR: Bs. {totales.qr}</p>
                  <p>Fleet: Bs. {totales.credito_fleet}</p>
                  <p className="font-semibold text-slate-600 mt-2 mb-1">Tipos de Combustible:</p>
                  <p>Gasolina Especial: Bs. {totales.gasolina_especial}</p>
                  <p>Gasolina Premium: Bs. {totales.gasolina_premium}</p>
                  <p>Diésel: Bs. {totales.diesel}</p>
                  <p>GNV: Bs. {totales.gnv}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Total Facturas</p>
                <h3 className="text-2xl font-bold text-emerald-600">{data.indicadores?.total_facturas ?? 0}</h3>
              </div>
              <div className={`bg-white p-4 rounded-xl shadow-sm ${totales.diferenciaTotalMonto < 0 ? 'border border-red-100 bg-red-50' : 'border border-slate-200'}`}>
                <p className={`text-xs uppercase font-bold mb-1 ${totales.diferenciaTotalMonto < 0 ? 'text-red-500' : 'text-slate-500'}`}>Diferencia Total</p>
                <h3 className={`text-2xl font-bold ${totales.diferenciaTotalMonto < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  Bs. {totales.diferenciaTotalMonto}
                </h3>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Turnos Pendientes</p>
                <h3 className="text-2xl font-bold text-slate-700">{String(data.tabla.length).padStart(2, '0')}</h3>
              </div>
            </div>

            {/* Sección Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sidebar - Turnos del Día */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-tighter mb-4">Turnos del Día</h2>
                
                {data.tabla && Array.isArray(data.tabla) && data.tabla.length > 0 ? (
                  data.tabla.map((turno, index) => (
                    <div 
                      key={turno.id}
                      className={`bg-white p-4 rounded-lg border-l-4 shadow-sm transition ${
                        index === 0 
                          ? 'border-l-emerald-500 hover:bg-slate-50 cursor-pointer' 
                          : 'border-l-slate-300 opacity-60 grayscale'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                          index === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {turno.turno_tipo || 'TURNO'}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-slate-800">{turno.operador_nombre || turno.operador || 'N/A'}</p>
                      <p className={`text-xs ${index === 0 ? 'text-slate-500' : 'text-slate-400 italic'}`}>
                        {index === 0 ? `Ubicación: ${turno.ubicacion || turno.sucursal_nombre || 'N/A'}` : 'Esperando cierre de sesión...'}
                      </p>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-600">Venta: Bs. {typeof turno.monto_sistema === 'number' ? turno.monto_sistema.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-center text-slate-500">
                    ✓ No hay turnos pendientes
                  </div>
                )}
              </div>

              {/* Tabla Principal */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                  <h2 className="font-bold text-slate-800">💰 Cuadre de Caja por Ventas</h2>
                  <span className="text-[10px] bg-slate-200 px-2 py-1 rounded font-bold text-slate-600">{hoy}</span>
                  <div className="space-x-2">
                    <button
                      onClick={exportarExcel}
                      className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-xs font-bold hover:bg-emerald-200 transition"
                    >
                      📊 Exportar Excel
                    </button>
                    <button
                      onClick={exportarPDF}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200 transition"
                    >
                      📄 Ver PDF
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-4">Operador</th>
                        <th className="p-4 text-center">Sucursal</th>
                        <th colSpan="4" className="p-4 text-center bg-blue-50">Métodos de Pago</th>
                        <th colSpan="4" className="p-4 text-center bg-green-50">Tipos Combustible</th>
                        <th className="p-4 text-center">Diferencia</th>
                        <th className="p-4 text-right">Monto (Bs)</th>
                        <th className="p-4 text-center">Acción</th>
                      </tr>
                      <tr>
                        <th colSpan="2"></th>
                        <th className="p-4 text-right text-blue-700">Efectivo</th>
                        <th className="p-4 text-right text-blue-700">Tarjeta</th>
                        <th className="p-4 text-right text-blue-700">QR</th>
                        <th className="p-4 text-right text-blue-700">Fleet</th>
                        <th className="p-4 text-right text-green-700">Especial</th>
                        <th className="p-4 text-right text-green-700">Premium</th>
                        <th className="p-4 text-right text-green-700">Diésel</th>
                        <th className="p-4 text-right text-green-700">GNV</th>
                        <th colSpan="3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.tabla && Array.isArray(data.tabla) && data.tabla.length > 0 ? (
                        data.tabla.map((turno) => (
                          <tr key={turno.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-bold text-slate-700">{turno.operador_nombre || turno.operador || 'N/A'}</td>
                            <td className="p-4 text-center text-slate-600 text-sm">{turno.ubicacion || turno.sucursal_nombre || turno.sucursal || 'N/A'}</td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.metodos_pago?.efectivo === 'number' ? turno.metodos_pago.efectivo.toFixed(2) : '0.00'}
                            </td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.metodos_pago?.tarjeta === 'number' ? turno.metodos_pago.tarjeta.toFixed(2) : '0.00'}
                            </td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.metodos_pago?.qr === 'number' ? turno.metodos_pago.qr.toFixed(2) : '0.00'}
                            </td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.metodos_pago?.credito_fleet === 'number' ? turno.metodos_pago.credito_fleet.toFixed(2) : '0.00'}
                            </td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.tipos_combustible?.gasolina_especial === 'number' ? turno.tipos_combustible.gasolina_especial.toFixed(2) : '0.00'}
                            </td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.tipos_combustible?.gasolina_premium === 'number' ? turno.tipos_combustible.gasolina_premium.toFixed(2) : '0.00'}
                            </td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.tipos_combustible?.diesel === 'number' ? turno.tipos_combustible.diesel.toFixed(2) : '0.00'}
                            </td>
                            <td className="p-4 text-right text-slate-700 text-sm">
                              Bs. {typeof turno.tipos_combustible?.gnv === 'number' ? turno.tipos_combustible.gnv.toFixed(2) : '0.00'}
                            </td>
                            <td className={`p-4 text-center font-bold text-sm ${turno.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Bs. {typeof turno.diferencia === 'number' ? turno.diferencia.toFixed(2) : "0.00"}
                            </td>
                            <td className="p-4 text-right font-bold">
                              Bs. {typeof turno.monto_sistema === 'number' ? turno.monto_sistema.toFixed(2) : "0.00"}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleConsolidar(turno.id)}
                                disabled={consolidating === turno.id}
                                className={`px-3 py-1 rounded text-xs font-bold transition ${
                                  consolidating === turno.id
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                              >
                                {consolidating === turno.id ? '⏳ Procesando...' : '✓ Consolidar'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="13" className="p-8 text-center text-slate-500">
                            {error ? '❌ Error al cargar datos' : '✓ No hay turnos pendientes de validación'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total Consolidado */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Consolidado</p>
                      <p className="text-2xl font-black text-emerald-600 italic">Bs. {totales.ventaTotal}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                ⚠️ {error}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConsolidacionCaja;