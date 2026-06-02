import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Fuel, Flame, CircleCheck as CheckCircle, Zap, FileText, Headphones, Shield, Target, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { preciosCombustibleService } from '../services/ventasService';

function LandingPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

 useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
}, []);
  // Callback para cuando el Header cierra sesión
  const handleLogout = () => {
    console.log('=== LANDING PAGE - Logout detectado desde Header ===');
    setIsAuthenticated(false);
  };

  const handleBuyClick = () => {
    // Check authentication at click time
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/comprar-combustible');
    } else {
      navigate('/register');
    }
  };

  const [combustibles, setCombustibles] = useState([]);
  const [loadingCombustibles, setLoadingCombustibles] = useState(true);

  useEffect(() => {
    const fetchCombustibles = async () => {
      try {
        const response = await preciosCombustibleService.getAll();
        const visualMap = {
          'GASOLINA_ESPECIAL': { border: 'border-gray-400', icon: 'text-gray-500', bg: 'bg-gray-50', iconBg: 'bg-gray-100', shadow: 'hover:shadow-gray-200', iconComp: Fuel },
          'GASOLINA_PREMIUM':  { border: 'border-red-500', icon: 'text-red-500', bg: 'bg-red-50', iconBg: 'bg-red-100', shadow: 'hover:shadow-red-200', iconComp: Fuel },
          'DIESEL':            { border: 'border-blue-900', icon: 'text-blue-800', bg: 'bg-blue-50', iconBg: 'bg-blue-100', shadow: 'hover:shadow-blue-200', iconComp: Fuel },
          'GNV':               { border: 'border-green-500', icon: 'text-green-500', bg: 'bg-green-50', iconBg: 'bg-green-100', shadow: 'hover:shadow-green-200', iconComp: Flame }
        };
        
        const dataMapped = response.data.map(item => {
          const defaultVisuals = { border: 'border-gray-400', icon: 'text-gray-500', bg: 'bg-white', iconBg: 'bg-gray-100', shadow: 'hover:shadow-gray-200', iconComp: Fuel };
          return {
            nombre: item.nombre,
            precio: item.precio_unitario,
            unidad: `Bs/${item.unidad.toUpperCase()}`,
            visuals: visualMap[item.codigo] || defaultVisuals
          };
        });
        
        setCombustibles(dataMapped);
      } catch (error) {
        console.error('Error fetching combustibles:', error);
      } finally {
        setLoadingCombustibles(false);
      }
    };

    fetchCombustibles();
  }, []);

  const servicios = [
    {
      icono: Zap,
      titulo: 'Carga Rápida',
      descripcion: 'Sistemas de despacho optimizados con tecnología de última generación para reducir tiempos de espera.'
    },
    {
      icono: FileText,
      titulo: 'Facturación Digital',
      descripcion: 'Gestión automática de comprobantes electrónicos y reportes de consumo en tiempo real.'
    },
    {
      icono: Headphones,
      titulo: 'Soporte 24/7',
      descripcion: 'Equipo técnico disponible las 24 horas para resolver cualquier inconveniente operativo.'
    }
  ];

  const caracteristicas = [
    {
      icono: Shield,
      titulo: 'Seguridad de Vanguardia',
      descripcion: 'Sistemas de control certificados con los más altos estándares internacionales de seguridad.'
    },
    {
      icono: Target,
      titulo: 'Precisión Garantizada',
      descripcion: 'Equipos calibrados periódicamente para asegurar mediciones exactas en cada despacho.'
    },
    {
      icono: Award,
      titulo: 'Control de Calidad',
      descripcion: 'Laboratorios propios que verifican la calidad del combustible constantemente.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header 
        transparent 
        showNav 
        showAuthButtons={!isAuthenticated} 
        showUserMenu={isAuthenticated}
        variant="dark" 
        onLogout={handleLogout}
      />

      <section className="relative pt-24 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://placehold.co/1920x1080/1e293b/64748b?text=Estacion+de+Servicio"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-4 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full mb-6">
                SISTEMA NACIONAL
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Gestión Inteligente de Combustible
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Monitoreo en tiempo real, compra anticipada y analítica avanzada para el sector energético boliviano.
              </p>

              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition shadow-lg">
                  COMENZAR AHORA
                </button>
                <button onClick={() => navigate('/sucursales')} className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-slate-900 transition">
                  VER SUCURSALES
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Fuel className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Surtidores Activos</h3>
                    <p className="text-gray-600 text-sm">Servicio continuo en toda nuestra red nacional</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Operación Segura</h3>
                    <p className="text-gray-600 text-sm">Certificación ISO 9001:2024 garantizada</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nuestros Combustibles</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingCombustibles ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando precios actualizados...</p>
              </div>
            ) : (
              combustibles.map((combustible, index) => {
                const Icon = combustible.visuals.iconComp;
                return (
                <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-xl p-6 shadow-md border-t-4 ${combustible.visuals.border} hover:-translate-y-1 hover:shadow-xl ${combustible.visuals.shadow} transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-lg ${combustible.visuals.iconBg}`}>
                      <Icon className={`w-6 h-6 ${combustible.visuals.icon}`} />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${combustible.visuals.bg} ${combustible.visuals.icon}`}>
                      Disponible
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">{combustible.nombre}</h3>
                  <div className="flex items-baseline mb-6 mt-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">{combustible.precio}</span>
                    <span className="text-gray-500 font-medium ml-2 text-sm sm:text-base">{combustible.unidad}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    console.log('=== BUTTON CLICK ===');
                    console.log('Token at click:', localStorage.getItem('access_token'));
                    handleBuyClick();
                  }}
                  className="w-full mt-auto px-4 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-orange-500 hover:shadow-md transition-colors duration-300 group flex items-center justify-center"
                >
                  {(() => {
                    const token = localStorage.getItem('access_token');
                    return token ? 'Comprar Ahora' : 'Registrarse para Comprar';
                  })()}
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.div>
              );
            }))}
          </div>
        </div>
      </section>

      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nuestros Servicios</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Soluciones integrales diseñadas para optimizar la gestión de combustible en su organización
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="inline-flex p-4 bg-orange-500 rounded-full mb-4">
                  <servicio.icono className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{servicio.titulo}</h3>
                <p className="text-gray-600 leading-relaxed">{servicio.descripcion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="sucursales" className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Presencia en todo el territorio boliviano</h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Contamos con una red estratégica de estaciones de servicio distribuidas en las principales ciudades y rutas del país, garantizando acceso continuo a combustible de calidad.
            </p>
            <button onClick={() => navigate('/sucursales')} className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition shadow-lg">
              LOCALIZAR SURTIDOR CERCANO
            </button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-slate-900 mb-8">¿Por qué elegir SurtidorBolivia?</h2>

              <div className="space-y-6">
                {caracteristicas.map((caracteristica, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                      <caracteristica.icono className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{caracteristica.titulo}</h3>
                      <p className="text-gray-600 leading-relaxed">{caracteristica.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="/images/planta.jpg"
                alt="Planta Industrial"
                className="rounded-xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer expanded variant="dark" />
    </div>
  );
}

export default LandingPage;
