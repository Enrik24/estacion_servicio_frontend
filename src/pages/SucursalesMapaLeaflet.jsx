import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Fuel, AlertTriangle, XCircle } from 'lucide-react';

// Fix leaflet default icon bug con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ---- Configuración de disponibilidad ----
const DISP = {
  disponible: { color: '#22c55e', bg: '#dcfce7', label: 'Disponible',  Icon: Fuel },
  bajo:       { color: '#f59e0b', bg: '#fef3c7', label: 'Nivel Bajo',  Icon: AlertTriangle },
  sin_stock:  { color: '#ef4444', bg: '#fee2e2', label: 'Sin Stock',   Icon: XCircle },
};

function getDisp(key) { return DISP[key] || DISP.sin_stock; }

// ---- Ícono de marcador ----
function buildIcon(sucursal) {
  const estados = (sucursal.combustibles || []).map((c) => c.disponibilidad);
  let color = '#22c55e';
  if (estados.length === 0 || estados.every((e) => e === 'sin_stock')) color = '#ef4444';
  else if (estados.some((e) => e === 'sin_stock') || estados.some((e) => e === 'bajo')) color = '#f59e0b';

  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px">⛽</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -42],
  });
}

// ---- Fly-to helper ----
function FlyTo({ sucursal }) {
  const map = useMap();
  useEffect(() => {
    if (sucursal && sucursal.latitud != null && sucursal.longitud != null) {
      map.flyTo([sucursal.latitud, sucursal.longitud], 15, { duration: 1.2 });
    }
  }, [sucursal, map]);
  return null;
}

// ---- Barra de nivel ----
function NivelBar({ pct, color }) {
  return (
    <div style={{ background: '#334155', borderRadius: 99, height: 6, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: '100%', borderRadius: 99, transition: 'width .5s ease' }} />
    </div>
  );
}

export default function SucursalesMapaLeaflet({ sucursales, selected, onSelect }) {
  const centroBolivia = [-16.5, -64.5];

  return (
    <MapContainer
      center={centroBolivia}
      zoom={6}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
      />
      {sucursales.map((s) => {
        if (s.latitud == null || s.longitud == null) return null;
        return (
          <Marker
            key={s.id}
            position={[s.latitud, s.longitud]}
            icon={buildIcon(s)}
            eventHandlers={{ click: () => onSelect(s) }}
          >
          <Popup>
            <div style={{ minWidth: 190, fontFamily: 'Inter, sans-serif' }}>
              <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 4px', color: '#0f172a' }}>{s.nombre}</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 10px' }}>{s.direccion}</p>
              {(s.combustibles || []).map((c) => {
                const d = getDisp(c.disponibilidad);
                return (
                  <div key={c.tipo} style={{ marginBottom: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{c.nombre}</span>
                      <span style={{ fontSize: 11, color: d.color, fontWeight: 700 }}>{d.label}</span>
                    </div>
                    <NivelBar pct={c.porcentaje_nivel} color={d.color} />
                  </div>
                );
              })}
            </div>
          </Popup>
        </Marker>
        );
      })}
      {selected && <FlyTo sucursal={selected} />}
    </MapContainer>
  );
}
