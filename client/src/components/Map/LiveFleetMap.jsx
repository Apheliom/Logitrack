import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';
import { renderToString } from 'react-dom/server';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// SVG-based icons — no emojis, clean geometric shapes
const makePin = (bg, ring, label) => L.divIcon({
  className: '',
  html: `
    <div style="position:relative; width:32px; height:38px;">
      <div style="
        position:absolute; bottom:0; left:50%; transform:translateX(-50%);
        width:0; height:0;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:10px solid ${bg};
      "></div>
      <div style="
        position:absolute; top:0; left:0; right:0;
        width:32px; height:28px;
        background:${bg};
        border:2px solid ${ring};
        border-radius:9999px;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.18);
        font-size:11px; font-weight:700; color:white;
        font-family:Inter,sans-serif;
        letter-spacing:-0.3px;
      ">${label}</div>
    </div>
  `,
  iconSize:   [32, 38],
  iconAnchor: [16, 38],
  popupAnchor:[0, -40]
});

const makeTruckIcon = (color) => L.divIcon({
  className: '',
  html: `
    <div style="
      width:36px; height:36px;
      background:${color};
      border:2.5px solid white;
      border-radius:9999px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,0.20);
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    </div>
  `,
  iconSize:   [36, 36],
  iconAnchor: [18, 18],
  popupAnchor:[0, -20]
});

const makeDepotIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="
      width:40px; height:40px;
      background:#1d4ed8;
      border:2.5px solid white;
      border-radius:10px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,0.22);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
  `,
  iconSize:   [40, 40],
  iconAnchor: [20, 20],
  popupAnchor:[0, -24]
});

const STATUS_COLORS = {
  DELIVERED:  '#16a34a',
  IN_TRANSIT: '#7c3aed',
  ASSIGNED:   '#0c8ee9',
  PENDING:    '#d97706',
  default:    '#6b7280',
};

const getOrderIcon = (status, index) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.default;
  return makePin(color, 'white', index + 1);
};

const PopupContent = ({ title, subtitle, rows = [] }) => (
  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 2 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{subtitle}</div>}
    {rows.map(([label, value], i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11, color: '#374151', marginTop: 4 }}>
        <span style={{ color: '#9ca3af' }}>{label}</span>
        <span style={{ fontWeight: 500 }}>{value}</span>
      </div>
    ))}
  </div>
);

export const LiveFleetMap = ({
  orders = [],
  drivers = [],
  activeRoute = null,
  center = [4.6534, -74.0836],
  zoom = 13
}) => {
  const { driverLocations } = useSocket();
  const depotCoords = [4.6534, -74.0836];

  const routePolyline = useMemo(() => {
    if (!activeRoute?.route_geojson) return null;
    try {
      const geo = typeof activeRoute.route_geojson === 'string'
        ? JSON.parse(activeRoute.route_geojson)
        : activeRoute.route_geojson;
      return geo?.geometry?.coordinates?.map(c => [c[1], c[0]]) || null;
    } catch { return null; }
  }, [activeRoute]);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-surface-3 shadow-card">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="w-full h-full">
        {/* OpenStreetMap — clean, libre, sin API key ni marca de agua */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Depot */}
        <Marker position={depotCoords} icon={makeDepotIcon()}>
          <Popup>
            <PopupContent title="Depósito Central" subtitle="Punto de salida y reabastecimiento" />
          </Popup>
        </Marker>

        {/* Route polyline */}
        {routePolyline && (
          <Polyline positions={routePolyline} pathOptions={{ color: '#7c3aed', weight: 4, opacity: 0.9, dashArray: '10 6' }} />
        )}

        {/* Order pins */}
        {orders.map((o, idx) => {
          if (!o.dest_lat || !o.dest_lng) return null;
          return (
            <Marker key={o.id || idx} position={[Number(o.dest_lat), Number(o.dest_lng)]} icon={getOrderIcon(o.status, idx)}>
              <Popup>
                <PopupContent
                  title={o.client_name}
                  subtitle={o.tracking_number}
                  rows={[
                    ['Dirección', o.delivery_address?.slice(0, 30) + (o.delivery_address?.length > 30 ? '…' : '')],
                    ['Estado', o.status],
                    ['Prioridad', o.priority],
                  ]}
                />
              </Popup>
            </Marker>
          );
        })}

        {/* Driver markers */}
        {drivers.map(driver => {
          const live = driverLocations[driver.id];
          const lat = live?.lat ?? Number(driver.current_lat);
          const lng = live?.lng ?? Number(driver.current_lng);
          if (!lat || !lng) return null;
          return (
            <Marker key={driver.id} position={[lat, lng]} icon={makeTruckIcon('#16a34a')}>
              <Popup>
                <PopupContent
                  title={driver.full_name}
                  subtitle={driver.vehicle_type}
                  rows={[
                    ['Placa', driver.license_plate || '—'],
                    ['Estado', driver.status || 'IDLE'],
                    ['Coords', `${lat.toFixed(4)}, ${lng.toFixed(4)}`],
                  ]}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
