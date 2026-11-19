import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';

// Fix Leaflet marker asset lookup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Marcadores vectoriales en SVG puro (CERO EMOJIS)
const createStopMarker = (number, color = '#2563eb') => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="position: relative; width: 32px; height: 38px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.18));">
        <svg viewBox="0 0 32 38" width="32" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 22 16 22s16-11.5 16-22C32 7.163 24.837 0 16 0z" fill="${color}"/>
          <circle cx="16" cy="15" r="10" fill="#ffffff"/>
        </svg>
        <span style="
          position: absolute;
          top: 7px;
          left: 0;
          width: 32px;
          text-align: center;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: ${color};
        ">${number}</span>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36]
  });
};

const createDriverMarker = (name = 'Conductor', status = 'ON_DELIVERY') => {
  const isMoving = status === 'ON_DELIVERY';
  const color = isMoving ? '#16a34a' : '#64748b';

  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        ${isMoving ? `
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 9999px;
            background: rgba(22, 163, 74, 0.25);
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ''}
        <div style="
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2.5px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22]
  });
};

const createDepotMarker = () => {
  return L.divIcon({
    className: 'custom-depot-marker',
    html: `
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #1e293b;
        border: 2px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.22);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4v18"/>
          <path d="M19 21V11l-6-4"/>
          <path d="M9 9h1"/>
          <path d="M9 13h1"/>
          <path d="M9 17h1"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22]
  });
};

export const LiveFleetMap = ({
  orders = [],
  drivers = [],
  activeRoute = null,
  center = [4.6534, -74.0836],
  zoom = 13
}) => {
  const { driverLocations } = useSocket();
  const depotCoords = [4.6534, -74.0836];

  // Extraer coordenadas de la polilínea
  const routePolyline = useMemo(() => {
    if (!activeRoute?.route_geojson) return null;
    try {
      const geo = typeof activeRoute.route_geojson === 'string'
        ? JSON.parse(activeRoute.route_geojson)
        : activeRoute.route_geojson;
      return geo?.geometry?.coordinates?.map(c => [c[1], c[0]]) || null;
    } catch {
      return null;
    }
  }, [activeRoute]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return '#16a34a'; // Verde esmeralda
      case 'IN_TRANSIT':
        return '#7c3aed'; // Violeta elegante
      case 'ASSIGNED':
        return '#0284c7'; // Azul cielo
      case 'PENDING':
        return '#ea580c'; // Naranja profesional
      default:
        return '#64748b';
    }
  };

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-white relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap estándar — 100% libre, sin API key, sin marcas de agua */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Depósito Central */}
        <Marker position={depotCoords} icon={createDepotMarker()}>
          <Popup>
            <div className="p-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Base Operativa
              </span>
              <strong className="text-slate-900 text-sm font-semibold block mt-0.5">
                Depósito Logístico Central
              </strong>
              <p className="text-xs text-slate-600 mt-1">
                Punto de carga, empaque y distribución de flota.
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Polilínea de Ruta Optimizada */}
        {routePolyline && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: '#4f46e5',
              weight: 4.5,
              opacity: 0.85,
              dashArray: '8, 8',
              lineJoin: 'round'
            }}
          />
        )}

        {/* Marcadores de Pedidos / Paradas */}
        {orders.map((order, idx) => {
          if (!order.dest_lat || !order.dest_lng) return null;
          const markerColor = getStatusColor(order.status);

          return (
            <Marker
              key={order.id || idx}
              position={[Number(order.dest_lat), Number(order.dest_lng)]}
              icon={createStopMarker(idx + 1, markerColor)}
            >
              <Popup>
                <div className="p-1 text-slate-800">
                  <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100">
                    <span className="text-[10px] font-mono font-semibold text-blue-600">
                      {order.tracking_number}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${markerColor}15`,
                        color: markerColor
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <strong className="text-sm font-semibold text-slate-900 block mt-1.5">
                    {order.client_name}
                  </strong>
                  <p className="text-xs text-slate-600 mt-0.5">{order.delivery_address}</p>

                  <div className="mt-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span>Prioridad:</span>
                    <span className="font-medium text-slate-700">{order.priority}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcadores de Repartidores en Vivo */}
        {drivers.map((driver) => {
          const liveLoc = driverLocations[driver.id];
          const lat = liveLoc ? liveLoc.lat : Number(driver.current_lat);
          const lng = liveLoc ? liveLoc.lng : Number(driver.current_lng);

          if (!lat || !lng) return null;

          return (
            <Marker
              key={driver.id}
              position={[lat, lng]}
              icon={createDriverMarker(driver.full_name, driver.status)}
            >
              <Popup>
                <div className="p-1 text-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{driver.full_name}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Vehículo: {driver.vehicle_type} (Placa: {driver.license_plate || 'S/P'})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Coords: {lat.toFixed(4)}, {lng.toFixed(4)}
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
