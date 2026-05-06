import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix para el icono del marker en Leaflet con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MarkerClick({ onSelect }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

function MapaPicker({ latitud, longitud, onSelect }) {
    const defaultPos = [-17.7833, -63.1821]; // Santa Cruz de la Sierra
    const pos = latitud && longitud ? [parseFloat(latitud), parseFloat(longitud)] : null;

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Ubicación en el mapa — haz clic para marcar
            </label>
            <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '250px' }}>
                <MapContainer
                    center={pos || defaultPos}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    <MarkerClick onSelect={onSelect} />
                    {pos && <Marker position={pos} />}
                </MapContainer>
            </div>
            {latitud && longitud && (
                <p className="text-xs text-gray-400">
                    Lat: {parseFloat(latitud).toFixed(6)} — Lng: {parseFloat(longitud).toFixed(6)}
                </p>
            )}
        </div>
    );
}

export default MapaPicker;