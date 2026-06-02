import { useEffect, useState, Component, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Fuel, Flame, AlertTriangle, XCircle, Navigation, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sucursalesPublicasService } from '../services/sucursalesPublicasService';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// ---- Configuración de disponibilidad ----
const DISP = {
  disponible: { color: '#22c55e', bg: '#dcfce7', label: 'Disponible',  Icon: Fuel },
  bajo:       { color: '#f59e0b', bg: '#fef3c7', label: 'Nivel Bajo',  Icon: AlertTriangle },
  sin_stock:  { color: '#ef4444', bg: '#fee2e2', label: 'Sin Stock',   Icon: XCircle },
};
function getDisp(key) { return DISP[key] || DISP.sin_stock; }

// ---- Barra de nivel ----
function NivelBar({ pct, color }) {
  return (
    <div style={{ background: '#334155', borderRadius: 99, height: 6, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: '100%', borderRadius: 99, transition: 'width .5s ease' }} />
    </div>
  );
}

// ---- Error Boundary ----
class ErrBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, border: '1px solid #ef444466', maxWidth: 700, width: '100%' }}>
            <h2 style={{ color: '#ef4444', fontWeight: 700, marginBottom: 12 }}>Error al cargar el mapa</h2>
            <pre style={{ color: '#94a3b8', fontSize: 12, whiteSpace: 'pre-wrap', background: '#0f172a', padding: 16, borderRadius: 8, overflow: 'auto', maxHeight: 300 }}>
              {this.state.err.toString()}{'\n\n'}{this.state.err.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---- Componente de mapa cargado dinámicamente ----
const MapaInteractivo = lazy(() => import('./SucursalesMapaLeaflet'));

// ---- Página principal ----
function SucursalesPageContent() {
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [isAuth, setIsAuth]         = useState(false);

  useEffect(() => {
    setIsAuth(!!localStorage.getItem('access_token'));
  }, []);

  useEffect(() => {
    sucursalesPublicasService
      .getAll()
      .then((res) => {
        const data = res.data || [];
        setSucursales(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch((e) => setError('No se pudieron cargar las sucursales: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <Header transparent showNav={false} showAuthButtons={!isAuth} showUserMenu={isAuth} variant="dark" />

      {/* ─── Hero ─── */}
      <section style={{ paddingTop: 80, paddingBottom: 28, background: 'linear-gradient(135deg,#0f172a,#1e293b,#0f172a)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 0 }}>Inicio</button>
              <ChevronRight size={14} color="#64748b" />
              <span style={{ color: '#f97316', fontSize: 14, fontWeight: 600 }}>Sucursales</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(249,115,22,.4)', flexShrink: 0 }}>
                <MapPin size={26} color="white" />
              </div>
              <div>
                <h1 style={{ color: 'white', fontSize: 30, fontWeight: 800, margin: 0 }}>Nuestras Sucursales</h1>
                <p style={{ color: '#94a3b8', margin: '6px 0 0', fontSize: 15 }}>Encuentra tu estación más cercana y consulta la disponibilidad de combustibles en tiempo real.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
              {Object.entries(DISP).map(([k, cfg]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{cfg.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Main grid ─── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Lista lateral */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5, delay: .1 }}
          style={{ background: '#1e293b', borderRadius: 20, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', maxHeight: 600, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ padding: '16px 20px 10px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>
              {loading ? 'Cargando...' : `${sucursales.length} sucursales`}
            </p>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #f97316', borderTopColor: 'transparent', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#64748b', fontSize: 13 }}>Cargando sucursales...</p>
              </div>
            )}
            {error && <div style={{ padding: 24, textAlign: 'center' }}><p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p></div>}
            {!loading && !error && sucursales.map((s) => {
              const estados  = (s.combustibles || []).map((c) => c.disponibilidad);
              const sinStock = estados.every((e) => e === 'sin_stock');
              const conAlt   = estados.some((e) => e === 'bajo') || estados.some((e) => e === 'sin_stock');
              const dot = sinStock ? '#ef4444' : conAlt ? '#f59e0b' : '#22c55e';
              const isSel = selected?.id === s.id;
              return (
                <button key={s.id} onClick={() => setSelected(s)} style={{ width: '100%', textAlign: 'left', background: isSel ? 'rgba(249,115,22,.1)' : 'transparent', border: 'none', borderLeft: isSel ? '3px solid #f97316' : '3px solid transparent', padding: '12px 20px', cursor: 'pointer', transition: 'all .2s', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: isSel ? '#f97316' : '#f1f5f9', fontWeight: 700, fontSize: 13, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</p>
                      <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 7px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {s.direccion}</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(s.combustibles || []).map((c) => { const d = getDisp(c.disponibilidad); return <span key={c.tipo} style={{ background: d.bg, color: d.color, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>{c.nombre.split(' ')[0]}</span>; })}
                        {s.tiene_gnv && <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>GNV</span>}
                      </div>
                    </div>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 4, marginLeft: 8, boxShadow: `0 0 7px ${dot}` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Mapa + detalle */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5, delay: .2 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Mapa dinámico */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)', height: 420, boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
            {loading ? (
              <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#64748b' }}>Cargando mapa...</p>
              </div>
            ) : (
              <ErrBoundary>
                <Suspense fallback={<div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#64748b' }}>Iniciando mapa...</p></div>}>
                  <MapaInteractivo sucursales={sucursales} selected={selected} onSelect={setSelected} />
                </Suspense>
              </ErrBoundary>
            )}
          </div>

          {/* Panel detalle */}
          {selected && (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }} style={{ background: '#1e293b', borderRadius: 20, border: '1px solid rgba(255,255,255,.07)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ color: '#f1f5f9', fontSize: 19, fontWeight: 800, margin: '0 0 4px' }}>{selected.nombre}</h2>
                  <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>📍 {selected.direccion}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {selected.telefono && (
                    <a href={`tel:${selected.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,.12)', color: '#f97316', border: '1px solid rgba(249,115,22,.25)', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      <Phone size={13} /> {selected.telefono}
                    </a>
                  )}
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitud},${selected.longitud}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,.25)', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <Navigation size={13} /> Cómo llegar
                  </a>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                {(selected.combustibles || []).map((c) => {
                  const d = getDisp(c.disponibilidad);
                  const DIcon = d.Icon;
                  return (
                    <div key={c.tipo} style={{ background: '#0f172a', borderRadius: 13, padding: '13px 15px', border: `1px solid ${d.color}33` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700 }}>{c.nombre}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: d.bg, color: d.color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                          <DIcon size={10} /> {d.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ color: '#64748b', fontSize: 12 }}>Nivel actual</span>
                        <span style={{ color: d.color, fontSize: 12, fontWeight: 700 }}>{c.porcentaje_nivel.toFixed(1)}%</span>
                      </div>
                      <NivelBar pct={c.porcentaje_nivel} color={d.color} />
                    </div>
                  );
                })}
                {selected.tiene_gnv && (
                  <div style={{ background: '#0f172a', borderRadius: 13, padding: '13px 15px', border: '1px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flame size={17} color="#22c55e" />
                    </div>
                    <div>
                      <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700, margin: 0 }}>Gas Natural (GNV)</p>
                      <p style={{ color: '#22c55e', fontSize: 12, margin: '2px 0 0', fontWeight: 600 }}>Disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Footer expanded variant="dark" />
    </div>
  );
}

export default function SucursalesPage() {
  return <ErrBoundary><SucursalesPageContent /></ErrBoundary>;
}
