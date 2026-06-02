import React, { useState, useEffect } from 'react';
import { User, CreditCard, Car, Save, Mail, Phone, Lock, Hash } from 'lucide-react';
import { clientesService } from '../services/clientesService';
import Swal from 'sweetalert2';
import Header from '../components/layout/Header';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    password: '',
    nit: '',
    telefono: '',
    placa: '',
    marca: '',
    modelo: '',
    color: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        setFormData(prev => ({
          ...prev,
          nombre: parsedUser.nombre || '',
          nit: parsedUser.nit || '',
          telefono: parsedUser.telefono || '',
          placa: parsedUser.placa || '',
          marca: parsedUser.marca || '',
          modelo: parsedUser.modelo || '',
          color: parsedUser.color || ''
        }));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    // Dispatch storage event so other tabs/components (like Header if it listened) could theoretically update
    window.dispatchEvent(new Event('storage'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.placa) {
      Swal.fire({
        icon: 'error',
        title: 'Atención',
        text: 'La placa del vehículo es obligatoria',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    setLoading(true);
    try {
      // Omitir password si está vacío
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      const response = await clientesService.completarPerfil(dataToSubmit);
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Tu perfil ha sido actualizado correctamente.',
          confirmButtonColor: '#10b981'
        });
        // Actualizar contexto si el backend devuelve los datos actualizados
        if (response.data.user) {
           updateUser(response.data.user);
        } else {
           // update with formData assuming success
           updateUser({
             nombre: formData.nombre,
             nit: formData.nit,
             telefono: formData.telefono,
             placa: formData.placa,
             marca: formData.marca,
             modelo: formData.modelo,
             color: formData.color,
           });
        }
        setFormData(prev => ({ ...prev, password: '' })); // clear password
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Ocurrió un error al actualizar el perfil.',
        confirmButtonColor: '#f97316'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showUserMenu={true} />
      
      <main className="max-w-4xl mx-auto pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="mt-2 text-slate-600">Actualiza tu información personal, de facturación y los datos de tu vehículo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card 1: Usuario */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">Información de Usuario</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cliente */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">Datos de Facturación y Contacto</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || user?.correo || ''}
                    disabled
                    className="pl-10 block w-full rounded-lg border-slate-200 bg-slate-100 border p-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">El correo no puede ser modificado.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIT / CI</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ej. 1234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Tu número de teléfono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Vehículo */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Car className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">Información del Vehículo</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Placa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="placa"
                  value={formData.placa}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej. ABC-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej. Toyota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej. Corolla"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-slate-300 bg-slate-50 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej. Blanco"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="h-5 w-5" />
              )}
              Guardar Cambios
            </button>
          </div>
          
        </form>
      </main>
    </div>
  );
};

export default ProfilePage;
