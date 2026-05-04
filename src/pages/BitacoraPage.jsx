import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { bitacoraService } from '../services/bitacoraService';

function BitacoraPage() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar datos desde el Backend
  useEffect(() => {
    const fetchBitacora = async () => {
      try {
        setLoading(true);
        const response = await bitacoraService.getAll();
        const registrosBackend = response.data.results ? response.data.results : response.data;
        setRegistros(registrosBackend);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la bitácora.');
      } finally {
        setLoading(false);
      }
    };

    fetchBitacora();
  }, []);

  // Lógica de Filtrado
  const registrosFiltrados = registros.filter((registro) => {
    const textoLibre = searchTerm.toLowerCase();
    
    const coincideTexto = 
      String(registro.id).toLowerCase().includes(textoLibre) ||
      (registro.usuario_nombre || '').toLowerCase().includes(textoLibre) ||
      (registro.usuario_email || '').toLowerCase().includes(textoLibre) ||
      (registro.usuario_rol || '').toLowerCase().includes(textoLibre) ||
      (registro.accion || '').toLowerCase().includes(textoLibre) ||
      (registro.modulo_afectado || '').toLowerCase().includes(textoLibre) ||
      (registro.descripcion || '').toLowerCase().includes(textoLibre) ||
      (registro.ip_address || '').includes(textoLibre) ||
      (registro.user_agent || '').toLowerCase().includes(textoLibre);

    const coincideAtributo = 
      filterAction === "todos" ||
      (filterAction === "web" && (registro.user_agent || '').includes("Web")) ||
      (filterAction === "movil" && (registro.user_agent || '').includes("Móvil")) ||
      (filterAction === "create" && registro.accion === "CREATE") ||
      (filterAction === "update" && registro.accion === "UPDATE") ||
      (filterAction === "delete" && registro.accion === "DELETE") ||
      (filterAction === "login" && registro.accion === "LOGIN");

    return coincideTexto && coincideAtributo;
  });

  // Paginación
  const totalPages = Math.ceil(registrosFiltrados.length / itemsPerPage) || 1;
  const currentPageSafe = currentPage > totalPages ? 1 : currentPage;
  const startIndex = (currentPageSafe - 1) * itemsPerPage;
  const registrosPaginados = registrosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilter = (e) => {
    setFilterAction(e.target.value);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilterAction('todos');
    setCurrentPage(1);
  };

  const getColorAccion = (accion) => {
    const colores = {
      CREATE: { bg: '#dcfce7', color: '#166534' },
      UPDATE: { bg: '#dbeafe', color: '#1e40af' },
      DELETE: { bg: '#fee2e2', color: '#991b1b' },
      LOGIN: { bg: '#f3e8ff', color: '#6b21a8' },
    };
    return colores[accion] || { bg: '#f3f4f6', color: '#374151' };
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "N/A";
    const fecha = new Date(fechaISO);
    const fechaStr = fecha.toLocaleDateString("es-BO");
    const horaStr = fecha.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
    return (
      <div className="date-time">
        <div>{fechaStr}</div>
        <div className="time" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{horaStr}</div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div>Cargando bitácora...</div>
        </main>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div style={{ color: 'red' }}>{error}</div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">📊 Bitácora de Auditoría</h2>
              <p className="text-gray-600">Registro de movimientos del sistema</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">🔍 Filtros</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Buscar por cualquier dato..."
                  />
                  <select value={filterAction} onChange={handleFilter} className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="todos">Todos los atributos</option>
                    <optgroup label="Acción">
                      <option value="create">✨ Crear</option>
                      <option value="update">📝 Actualizar</option>
                      <option value="delete">🗑️ Eliminar</option>
                      <option value="login">🔓 Acceso</option>
                    </optgroup>
                  </select>
                  <Button onClick={handleClear}>✕ Limpiar</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Módulo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dispositivo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registrosPaginados.length > 0 ? (
                      registrosPaginados.map((registro) => {
                        const colors = getColorAccion(registro.accion);
                        const iconoDispositivo = (registro.user_agent || '').includes("Mobile") || (registro.user_agent || '').includes("Android") ? "📱 Móvil" : "🌐 Web";

                        return (
                          <tr key={registro.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-700">{registro.id}</td>
                            <td className="px-4 py-3 text-sm font-semibold">{registro.usuario_nombre || 'Sistema'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{registro.usuario_email || 'N/A'}</td> 
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                {registro.usuario_rol || 'Sin Rol'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span style={{ backgroundColor: colors.bg, color: colors.color, padding: '0.3rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.7rem', fontWeight: '700' }}>
                                {registro.accion}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{registro.modulo_afectado}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{registro.descripcion}</td>
                            <td className="px-4 py-3 text-sm font-mono text-indigo-600">{registro.ip_address}</td>
                            <td className="px-4 py-3 text-sm font-semibold">{iconoDispositivo}</td>
                            <td className="px-4 py-3 text-sm">{formatearFecha(registro.fecha_hora)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                          No hay registros que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Página <strong>{currentPageSafe}</strong> de <strong>{totalPages}</strong> | Mostrando <strong>{registrosPaginados.length}</strong> de <strong>{registrosFiltrados.length}</strong> registros
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(c => c - 1)}
                    disabled={currentPageSafe === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(c => c + 1)}
                    disabled={currentPageSafe === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default BitacoraPage;