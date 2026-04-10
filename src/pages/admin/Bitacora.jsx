import React, { useState, useEffect, useMemo, useRef } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { bitacoraService } from '../../services/api';

export default function BitacoraModule() {
  // Estados para los datos del backend
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tableRef = useRef(null);
  
  // Estados de filtrado y paginación
  const [busquedaLibre, setBusquedaLibre] = useState("");
  const [filtroAtributo, setFiltroAtributo] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar registros del backend
  useEffect(() => {
    loadRegistros();
  }, []);

  const loadRegistros = async () => {
    setLoading(true);
    try {
      const response = await bitacoraService.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setRegistros(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar bitácora:', err);
      setError('Error al cargar el registro de auditoría');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Lógica de filtrado combinada
  const registrosFiltrados = useMemo(() => {
    return registros.filter((registro) => {
      const textoLibre = busquedaLibre.toLowerCase();
      const usuarioName = registro.usuario_nombre || registro.usuario || '';
      const accion = registro.accion || '';
      const modulo = registro.modulo_afectado || registro.modulo || '';
      const descripcion = registro.descripcion || '';
      const ip = registro.direccion_ip || registro.ip_address || '';
      const dispositivo = registro.dispositivo || '';

      const coincideTexto =
        String(registro.id).toLowerCase().includes(textoLibre) ||
        usuarioName.toLowerCase().includes(textoLibre) ||
        accion.toLowerCase().includes(textoLibre) ||
        modulo.toLowerCase().includes(textoLibre) ||
        descripcion.toLowerCase().includes(textoLibre) ||
        ip.includes(textoLibre) ||
        dispositivo.toLowerCase().includes(textoLibre);

      const coincideAtributo =
        filtroAtributo === "todos" ||
        (filtroAtributo === "web" && dispositivo.includes("Web")) ||
        (filtroAtributo === "movil" && dispositivo.includes("Móvil")) ||
        (filtroAtributo === "create" && accion === "CREATE") ||
        (filtroAtributo === "update" && accion === "UPDATE") ||
        (filtroAtributo === "delete" && accion === "DELETE") ||
        (filtroAtributo === "login" && accion === "LOGIN");

      return coincideTexto && coincideAtributo;
    });
  }, [busquedaLibre, filtroAtributo, registros]);

  // Resetear a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [busquedaLibre, filtroAtributo]);

  // 4. Cálculos de Paginación
  const totalPages = Math.max(1, Math.ceil(registrosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const registrosPaginados = registrosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const limpiarFiltros = () => {
    setBusquedaLibre("");
    setFiltroAtributo("todos");
    setCurrentPage(1);
  };

  // Asignación de colores para los badges usando Tailwind
  const getColorAccion = (accion) => {
    const colores = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      LOGIN: "bg-purple-100 text-purple-800",
    };
    return colores[accion] || "bg-gray-100 text-gray-800";
  };

  // Función para generar descripción del tipo de acción
  const getDescripcionAccion = (accion, modulo) => {
    const descripciones = {
      CREATE: `Se creó un nuevo registro en ${modulo}`,
      UPDATE: `Se actualizó un registro en ${modulo}`,
      DELETE: `Se eliminó un registro de ${modulo}`,
      LOGIN: `Se inició sesión en el sistema`,
      LOGOUT: `Se cerró sesión en el sistema`,
    };
    return descripciones[accion] || `Acción realizada en ${modulo}`;
  };

  // Función para obtener color del badge del módulo
  const getColorModulo = (modulo) => {
    const colores = {
      'Gestión de Personal': 'bg-purple-100 text-purple-800',
      'Gestión de Usuarios': 'bg-blue-100 text-blue-800',
      'Gestión de Roles': 'bg-indigo-100 text-indigo-800',
      'Gestión de Permisos': 'bg-cyan-100 text-cyan-800',
      'Configuración de Precios': 'bg-orange-100 text-orange-800',
      'Autenticación': 'bg-pink-100 text-pink-800',
      'Límites de Consumo': 'bg-amber-100 text-amber-800',
      'General': 'bg-gray-100 text-gray-800',
    };
    return colores[modulo] || 'bg-gray-100 text-gray-800';
  };

  // Función para descargar como PDF
  const descargarPDF = () => {
    if (!tableRef.current) return;

    // Crear elemento temporal con los datos
    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #334155; margin-bottom: 20px;">📊 Bitácora de Auditoría</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">Registro de movimientos del sistema</p>
        <p style="color: #6b7280; margin-bottom: 20px;">Generado: ${new Date().toLocaleString('es-BO')}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #1e293b; color: white;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">ID</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">Usuario</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">Acción</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">Módulo</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">Descripción</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">IP</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">Dispositivo</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold;">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody>
            ${registrosFiltrados.map((registro, idx) => {
              const usuarioName = registro.usuario_nombre || registro.usuario || 'Desconocido';
              const accion = registro.accion || 'SIN ACCIÓN';
              const modulo = registro.modulo_afectado || registro.modulo || 'General';
              const descripcion = registro.descripcion || getDescripcionAccion(accion, modulo);
              const ip = registro.direccion_ip || registro.ip_address || 'N/A';
              const dispositivo = registro.dispositivo || 'Desconocido';
              const fechaHora = registro.creado_en || registro.fecha_hora || new Date().toISOString();
              
              return `
                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="border: 1px solid #d1d5db; padding: 10px;">${registro.id}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">${usuarioName}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">${accion}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">${modulo}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">${descripcion}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px; font-family: monospace;">${ip}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">${dispositivo.includes("Móvil") ? "📱 Móvil" : "🌐 Web"}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">
                    <div>${new Date(fechaHora).toLocaleDateString("es-BO")}</div>
                    <div style="font-size: 12px; color: #6b7280;">${new Date(fechaHora).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <p style="color: #6b7280; margin-top: 20px; font-size: 12px;">Total de registros: ${registrosFiltrados.length}</p>
      </div>
    `;

    // Crear un iframe para imprimir
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bitácora de Auditoría</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background-color: #1e293b; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
          h1 { color: #334155; margin-bottom: 20px; }
          p { color: #6b7280; }
          @page { margin: 10mm; }
        </style>
      </head>
      <body>
        ${elemento.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    // Esperar a que se cargue y luego imprimir
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 100);
    };
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Bitácora de Auditoría</h2>
        <p className="text-gray-500 text-sm mt-1">Registro de movimientos del sistema</p>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={descargarPDF}
          disabled={loading || registrosFiltrados.length === 0}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Descargar PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Sección de Filtros */}
        <div className="p-4 bg-slate-50 border-b border-gray-200">
          <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
            Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Buscar por cualquier dato..."
              value={busquedaLibre}
              onChange={(e) => setBusquedaLibre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filtroAtributo}
              onChange={(e) => setFiltroAtributo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los atributos</option>
              <optgroup label="Dispositivo">
                <option value="web">🌐 Web</option>
                <option value="movil">📱 Móvil</option>
              </optgroup>
              <optgroup label="Acción">
                <option value="create">✨ Crear</option>
                <option value="update">📝 Actualizar</option>
                <option value="delete">🗑️ Eliminar</option>
                <option value="login">🔓 Acceso</option>
              </optgroup>
            </select>

            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              ✕ Limpiar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p>Cargando registros...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={loadRegistros}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Acción</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider min-w-[150px]">Módulo</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider min-w-[200px]">Descripción</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Origen (IP)</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Dispositivo</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Fecha/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrosPaginados.length > 0 ? (
                  registrosPaginados.map((registro, idx) => {
                    const usuarioName = registro.usuario_nombre || registro.usuario || 'Desconocido';
                    const accion = registro.accion || 'SIN ACCIÓN';
                    const modulo = registro.modulo_afectado || registro.modulo || 'General';
                    const descripcion = registro.descripcion || getDescripcionAccion(accion, modulo);
                    const ip = registro.direccion_ip || registro.ip_address || 'N/A';
                    const dispositivo = registro.dispositivo || 'Desconocido';
                    const fechaHora = registro.creado_en || registro.fecha_hora || new Date().toISOString();

                    return (
                      <tr 
                        key={registro.id} 
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-gray-500">{registro.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{usuarioName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${getColorAccion(accion)}`}>
                            {accion}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-md inline-block ${getColorModulo(modulo)}`}>
                            {modulo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium break-words max-w-[300px]">
                          {descripcion}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-indigo-600 font-medium">
                          {ip}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {dispositivo.includes("Móvil") ? "📱 Móvil" : "🌐 Web"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{new Date(fechaHora).toLocaleDateString("es-BO")}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(fechaHora).toLocaleTimeString("es-BO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500 text-sm">
                      No hay registros que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        <div className="px-4 py-4 border-t border-gray-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-bold text-slate-900">{registrosPaginados.length}</span> de <span className="font-bold text-slate-900">{registrosFiltrados.length}</span> registros
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-semibold border border-gray-300 rounded-md bg-white hover:bg-slate-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 text-sm font-bold rounded-md border transition-colors ${
                  currentPage === page
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-900 border-gray-300 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-semibold border border-gray-300 rounded-md bg-white hover:bg-slate-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}