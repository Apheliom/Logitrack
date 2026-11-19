import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';

// Corrección de íconos por defecto de Leaflet en React bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Generador de íconos SVG personalizados
const createCustomIcon = (colorBg, label, iconText = '📍') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${colorBg};
        color: white;
        border: 2px solid #ffffff;
        border-radius: 9999px;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
      ">
        ${iconText}
      </div>
      ${label ? `<div style="
        background: rgba(15, 23, 42, 0.85);
        color: #f8fafc;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        margin-top: 2px;
        border: 1px solid #334155;
        text-align: center;
      ">${label}</div>` : ''}
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
  });
};

const depotIcon = createCustomIcon('#6366f1', 'Centro Logístico', '🏢');
const driverIcon = createCustomIcon('#10b981', 'Repartidor', '🛵');

const getOrderIcon = (status, index) => {
  switch (status) {
    case 'DELIVERED':
      return createCustomIcon('#10b981', `P${index + 1}`, '✓');
    case 'IN_TRANSIT':
      return createCustomIcon('#8b5cf6', `P${index + 1}`, '📦');
    case 'ASSIGNED':
      return createCustomIcon('#0ea5e9', `P${index + 1}`, '⏱');
    default:
      return createCustomIcon('#f59e0b', `P${index + 1}`, '📍');
  }
};

export const LiveFleetMap = ({
  orders = [],
  drivers = [],
  activeRoute = null,
  center = [4.6534, -74.0836],
  zoom = 13
}) => {
  const { driverLocations } = useSocket();

  // Coordenadas del depósito central
  const depotCoords = [4.6534, -74.0836];

  // Extraer coordenadas de la polilínea de ruta activa si existe
  const routePolyline = useMemo(() => {
    if (!activeRoute || !activeRoute.route_geojson) return null;
    try {
      const geojson = typeof activeRoute.route_geojson === 'string'
        ? JSON.parse(activeRoute.route_geojson)
        : activeRoute.route_geojson;

      if (geojson && geojson.geometry && geojson.geometry.coordinates) {
        // En GeoJSON es [lng, lat], Leaflet espera [lat, lng]
        return geojson.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      }
    } catch (e) {
      console.error('[Map] Error al parsear ruta GeoJSON:', e);
    }
    return null;
  }, [activeRoute]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Capa de OpenStreetMap (Tiles CartoDB Dark Matter para estilo moderno) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Marcador del Depósito Central */}
        <Marker position={depotCoords} icon={depotIcon}>
          <Popup>
            <div className="p-1">
              <strong className="text-indigo-400 block font-semibold">🏢 Depósito Central LogiTrack</strong>
              <span className="text-xs text-slate-300">Punto de partida y abastecimiento de flota</span>
            </div>
          </Popup>
        </Marker>

        {/* Polilínea de Ruta Optimizada */}
        {routePolyline && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: '#6366f1',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 8'
            }}
          />
        )}

        {/* Marcadores de Pedidos / Puntos de Entrega */}
        {orders.map((order, idx) => {
          if (!order.dest_lat || !order.dest_lng) return null;
          return (
            <Marker
              key={order.id || idx}
              position={[Number(order.dest_lat), Number(order.dest_lng)]}
              icon={getOrderIcon(order.status, idx)}
            >
              <Popup>
                <div className="p-1 text-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {order.tracking_number}
                  </span>
                  <strong className="text-emerald-400 font-medium block mt-0.5">
                    {order.client_name}
                  </strong>
                  <p className="text-xs text-slate-300 mt-1">{order.delivery_address}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700">
                    <span className="font-semibold text-slate-400">Estado:</span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-200">
                      {order.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcadores de Repartidores en Vivo (Con telemetría WebSockets en tiempo real) */}
        {drivers.map((driver) => {
          // Si el socket tiene una ubicación más reciente, usarla preferentemente
          const liveLoc = driverLocations[driver.id];
          const lat = liveLoc ? liveLoc.lat : Number(driver.current_lat);
          const lng = liveLoc ? liveLoc.lng : Number(driver.current_lng);

          if (!lat || !lng) return null;

          return (
            <Marker
              key={driver.id}
              position={[lat, lng]}
              icon={driverIcon}
            >
              <Popup>
                <div className="p-1 text-slate-200">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span>🛵</span>
                    <span>{driver.full_name || 'Conductor'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Vehículo: {driver.vehicle_type} ({driver.license_plate || 'S/P'})
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Coords: {lat.toFixed(4)}, {lng.toFixed(4)}
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                    <span className="text-emerald-300">Transmitiendo en vivo</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
};
