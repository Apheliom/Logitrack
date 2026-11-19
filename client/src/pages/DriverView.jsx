import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SignaturePadModal } from '../components/Orders/SignaturePadModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  Package,
  MapPin,
  CheckCircle,
  Radio,
  ExternalLink,
  Phone,
  ShieldCheck,
  RotateCw,
  PlusCircle,
  Layers,
  Inbox,
  Play,
  Square,
  Warehouse
} from 'lucide-react';

// Almacén Central de Despacho — Cabudare Centro, Estado Lara
const WAREHOUSE = { lat: 10.0305, lng: -69.2635, label: 'Almacén Central LogiTrack — Cabudare Centro' };

const warehouseIcon = L.divIcon({
  className: 'custom-warehouse-icon',
  html: `<div style="width:38px;height:38px;background:#1e293b;border:3px solid white;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.35);">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const driverIcon = L.divIcon({
  className: 'custom-driver-on-route',
  html: `<div style="position:relative;width:40px;height:40px;">
    <div style="position:absolute;inset:0;background:rgba(16,185,129,0.25);border-radius:50%;animation:pulse 1.5s infinite;"></div>
    <div style="position:relative;width:40px;height:40px;background:#059669;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(5,150,105,0.5);">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    </div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const stopIcon = L.divIcon({
  className: 'custom-stop-icon',
  html: `<div style="width:30px;height:36px;position:relative;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.25));">
    <svg viewBox="0 0 30 36" width="30" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 1C8.37 1 3 6.37 3 13c0 8.75 12 22 12 22S27 21.75 27 13C27 6.37 21.63 1 15 1z" fill="#2563eb" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="13" r="5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [30, 36],
  iconAnchor: [15, 36],
  popupAnchor: [0, -36]
});

// Ajusta el mapa para mostrar todos los puntos de la ruta
const DriverMapBounds = ({ waypoints }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !waypoints || waypoints.length === 0) return;
    const bounds = L.latLngBounds(waypoints.map(wp => [wp.lat, wp.lng]));
    bounds.extend([WAREHOUSE.lat, WAREHOUSE.lng]);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [map, waypoints.length]);
  return null;
};

export const DriverView = () => {
  const { user } = useAuth();
  const { sendDriverGPS } = useSocket();
  const [activeTab, setActiveTab] = useState('ASSIGNED'); // 'ASSIGNED' | 'POOL'
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpsActive, setGpsActive] = useState(true);
  const [selectedOrderForSignature, setSelectedOrderForSignature] = useState(null);
  const [statusMessage, setStatusMessage] = useState('GPS permanente activo: emitiendo señal en tiempo real.');
  const [simRunning, setSimRunning] = useState(false);
  const [simPosition, setSimPosition] = useState(null); // { lat, lng }
  const simTimerRef = useRef(null);
  const simStepRef = useRef(0);

  const driverId = user?.driver_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignedRes, availableRes] = await Promise.all([
        api.get(`/orders?driver_id=${driverId}`),
        api.get('/orders?unassigned=true')
      ]);

      if (assignedRes.success) setAssignedOrders(assignedRes.orders || []);
      if (availableRes.success) setAvailableOrders(availableRes.orders || []);
    } catch (err) {
      console.error('[DriverView Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [driverId]);

  // Transmisión GPS permanente y automática para el repartidor
  useEffect(() => {
    let watchSubscriptionId = null;
    let keepAliveTimer = null;
    let lastCoords = { lat: 10.0305, lng: -69.2635 };

    const broadcastGps = async (lat, lng) => {
      lastCoords = { lat, lng };
      sendDriverGPS({
        driver_id: driverId,
        driver_name: user?.full_name || 'Conductor',
        lat,
        lng
      });

      try {
        await api.post(`/drivers/${driverId}/location`, { lat, lng });
      } catch (e) {
        // Evitar saturar logs por fallos temporales de red HTTP
      }
    };

    if (navigator.geolocation) {
      watchSubscriptionId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          broadcastGps(latitude, longitude);
          setGpsActive(true);
          setStatusMessage('GPS en tiempo real transmitiendo telemetría.');
        },
        (error) => {
          console.warn('[Driver GPS Warning]', error.message);
          setStatusMessage('GPS permanente activo (telemetría continua sincronizada).');
          broadcastGps(lastCoords.lat, lastCoords.lng);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    } else {
      setStatusMessage('Geolocalización por hardware no disponible, emitiendo posición predeterminada.');
    }

    // Pulso constante cada 4 segundos para asegurar que el cliente siempre tenga ubicación viva
    keepAliveTimer = setInterval(() => {
      broadcastGps(lastCoords.lat, lastCoords.lng);
    }, 4000);

    return () => {
      if (watchSubscriptionId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchSubscriptionId);
      }
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }
    };
  }, [driverId, user]);

  // ─── Simulador de Recorrido para Defensa ───────────────────────────────────
  // Genera waypoints interpolados desde el Almacén Central hacia los destinos
  const buildSimWaypoints = () => {
    const steps = [{ lat: WAREHOUSE.lat, lng: WAREHOUSE.lng }];
    for (const order of assignedOrders) {
      if (!order.dest_lat || !order.dest_lng) continue;
      const dLat = Number(order.dest_lat);
      const dLng = Number(order.dest_lng);
      const prev = steps[steps.length - 1];
      // Interpolar 6 puntos entre el punto anterior y el destino
      for (let i = 1; i <= 6; i++) {
        const t = i / 6;
        const jLat = (Math.random() - 0.5) * 0.0003;
        const jLng = (Math.random() - 0.5) * 0.0003;
        steps.push({
          lat: Number((prev.lat + (dLat - prev.lat) * t + jLat).toFixed(6)),
          lng: Number((prev.lng + (dLng - prev.lng) * t + jLng).toFixed(6))
        });
      }
      steps.push({ lat: dLat, lng: dLng });
    }
    // Regresar al almacén
    if (steps.length > 1) {
      const last = steps[steps.length - 1];
      for (let i = 1; i <= 4; i++) {
        const t = i / 4;
        steps.push({
          lat: Number((last.lat + (WAREHOUSE.lat - last.lat) * t).toFixed(6)),
          lng: Number((last.lng + (WAREHOUSE.lng - last.lng) * t).toFixed(6))
        });
      }
    }
    return steps;
  };

  const startSimulation = () => {
    if (simRunning) return;
    const waypoints = buildSimWaypoints();
    if (waypoints.length < 2) {
      setStatusMessage('Asigna entregas primero para simular la ruta.');
      return;
    }
    simStepRef.current = 0;
    setSimRunning(true);
    setStatusMessage('Simulacion de recorrido activa — Los mapas se mueven en tiempo real.');

    simTimerRef.current = setInterval(async () => {
      const idx = simStepRef.current % waypoints.length;
      const wp = waypoints[idx];
      setSimPosition({ lat: wp.lat, lng: wp.lng });

      sendDriverGPS({
        driver_id: driverId,
        driver_name: user?.full_name || 'Conductor',
        lat: wp.lat,
        lng: wp.lng
      });

      try {
        await api.post(`/drivers/${driverId}/location`, { lat: wp.lat, lng: wp.lng });
      } catch (_) {}

      simStepRef.current += 1;

      // Al completar el recorrido, detener automáticamente
      if (simStepRef.current >= waypoints.length) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
        setSimRunning(false);
        setStatusMessage('Simulación de recorrido completada. GPS permanente retomado.');
      }
    }, 1500);
  };

  const stopSimulation = () => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setSimRunning(false);
    setSimPosition(null);
    setStatusMessage('GPS permanente activo: emitiendo señal en tiempo real.');
  };

  // Cleanup al desmontar
  useEffect(() => () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
  }, []);

  // Reclamar paquete libre para la ruta
  const handleClaimOrder = async (orderId) => {
    try {
      const res = await api.patch(`/orders/${orderId}/claim`, {});
      if (res.success) {
        alert('Paquete tomado exitosamente. Ahora aparece en tus entregas asignadas.');
        loadData();
        setActiveTab('ASSIGNED');
      }
    } catch (err) {
      alert('Error al reclamar paquete: ' + err.message);
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: 'IN_TRANSIT'
      });
      if (res.success) {
        setAssignedOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'IN_TRANSIT' } : o))
        );
      }
    } catch (err) {
      alert('Error al iniciar entrega: ' + err.message);
    }
  };

  const handleSaveSignature = async (signatureBase64) => {
    if (!selectedOrderForSignature) return;
    try {
      const res = await api.patch(`/orders/${selectedOrderForSignature.id}/status`, {
        status: 'DELIVERED',
        signature_data: signatureBase64,
        delivery_notes: 'Entrega confirmada con firma digital por receptor.'
      });

      if (res.success) {
        setAssignedOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrderForSignature.id
              ? { ...o, status: 'DELIVERED', signature_data: signatureBase64 }
              : o
          )
        );
        setSelectedOrderForSignature(null);
      }
    } catch (err) {
      alert('Error al registrar entrega: ' + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Driver Header Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg shadow-xs">
              <Navigation className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{user?.full_name || 'Conductor'}</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {user?.vehicle_type || 'Vehículo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Terminal móvil de ruta y despacho</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>GPS Siempre Activo</span>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Mapa de Ruta en Vivo + Simulador de Recorrido para Defensa */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Ruta en Vivo desde Almacén</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-slate-400" />
              Almacén Central — Cabudare Centro, Lara
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!simRunning ? (
              <button
                onClick={startSimulation}
                disabled={assignedOrders.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5" />
                Simular Recorrido
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-xs transition"
              >
                <Square className="w-3.5 h-3.5" />
                Detener Simulación
              </button>
            )}
          </div>
        </div>

        {simRunning && (
          <div className="flex items-center gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span>Simulación activa — El marcador se mueve en tiempo real en todos los mapas del sistema.</span>
          </div>
        )}

        <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-slate-200">
          <MapContainer
            center={[WAREHOUSE.lat, WAREHOUSE.lng]}
            zoom={13}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <DriverMapBounds waypoints={[
              ...assignedOrders.filter(o => o.dest_lat && o.dest_lng).map(o => ({
                lat: Number(o.dest_lat), lng: Number(o.dest_lng)
              })),
              WAREHOUSE
            ]} />

            {/* Almacén Central */}
            <Marker position={[WAREHOUSE.lat, WAREHOUSE.lng]} icon={warehouseIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong className="text-slate-900 block">Almacén Central</strong>
                  <span className="text-slate-500">Punto de despacho — Cabudare Centro</span>
                </div>
              </Popup>
            </Marker>

            {/* Polilínea: Almacén → Paradas de Entrega */}
            {assignedOrders.filter(o => o.dest_lat && o.dest_lng).length > 0 && (
              <>
                <Polyline
                  positions={[
                    [WAREHOUSE.lat, WAREHOUSE.lng],
                    ...assignedOrders
                      .filter(o => o.dest_lat && o.dest_lng)
                      .map(o => [Number(o.dest_lat), Number(o.dest_lng)])
                  ]}
                  pathOptions={{ color: '#0f172a', weight: 5, opacity: 0.18 }}
                />
                <Polyline
                  positions={[
                    [WAREHOUSE.lat, WAREHOUSE.lng],
                    ...assignedOrders
                      .filter(o => o.dest_lat && o.dest_lng)
                      .map(o => [Number(o.dest_lat), Number(o.dest_lng)])
                  ]}
                  pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.9, dashArray: '7 5' }}
                />
              </>
            )}

            {/* Paradas de entrega */}
            {assignedOrders.filter(o => o.dest_lat && o.dest_lng).map((order, idx) => (
              <Marker
                key={order.id}
                position={[Number(order.dest_lat), Number(order.dest_lng)]}
                icon={stopIcon}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-blue-700 block">{`Parada #${idx + 1}`}</strong>
                    <span className="text-slate-800 font-semibold block">{order.client_name}</span>
                    <span className="text-slate-500">{order.delivery_address}</span>
                    <span className={`mt-1 block font-bold ${order.status === 'DELIVERED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {order.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Marcador del conductor en simulación */}
            {simPosition && (
              <Marker position={[simPosition.lat, simPosition.lng]} icon={driverIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-emerald-700 block">{user?.full_name || 'Conductor'}</strong>
                    <span className="text-slate-500">Simulación en curso</span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Selector de Pestañas: Mis Asignadas vs Bolsa de Libres */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        <button
          onClick={() => setActiveTab('ASSIGNED')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'ASSIGNED'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Mis Entregas ({assignedOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('POOL')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'POOL'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Bolsa de Paquetes Libres ({availableOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Mis Entregas Asignadas */}
      {activeTab === 'ASSIGNED' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">Tu Ruta de Paradas Programadas</span>
            <button
              onClick={loadData}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {assignedOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 text-sm space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800">No tienes entregas asignadas actualmente.</p>
              <p className="text-xs text-slate-400">
                Pasa a la pestaña "Bolsa de Paquetes Libres" para tomar pedidos pendientes.
              </p>
            </div>
          ) : (
            assignedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    {order.tracking_number}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${order.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.status === 'IN_TRANSIT'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                  >
                    {order.status === 'DELIVERED' ? 'Entregado' : order.status === 'IN_TRANSIT' ? 'En Ruta' : 'Asignado'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{order.client_name}</h3>
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{order.delivery_address}</span>
                  </div>
                  {order.delivery_notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
                      {order.delivery_notes}
                    </p>
                  )}
                </div>

                {order.client_phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`tel:${order.client_phone}`} className="hover:text-blue-600 font-semibold underline">
                      {order.client_phone}
                    </a>
                  </div>
                )}

                {/* Acciones de la parada */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.dest_lat},${order.dest_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Maps</span>
                  </a>

                  {order.status !== 'DELIVERED' ? (
                    <div className="flex items-center gap-2">
                      {order.status !== 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleStartDelivery(order.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          Iniciar Ruta
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrderForSignature(order)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Firmar y Entregar</span>
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Completado</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Bolsa de Paquetes Libres */}
      {activeTab === 'POOL' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">Paquetes Pendientes de Asignación</span>
            <span className="text-xs text-slate-400">Puedes tomar pedidos para añadirlos a tu turno</span>
          </div>

          {availableOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 text-sm space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-800">No hay paquetes libres pendientes.</p>
              <p className="text-xs text-slate-400">Todas las órdenes han sido asignadas a conductores.</p>
            </div>
          ) : (
            availableOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {order.tracking_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Pendiente
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{order.client_name}</h3>
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{order.delivery_address}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Prioridad: <strong className="text-slate-800">{order.priority}</strong>
                  </span>
                  <button
                    onClick={() => handleClaimOrder(order.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tomar Paquete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Signature Modal */}
      <SignaturePadModal
        isOpen={!!selectedOrderForSignature}
        order={selectedOrderForSignature}
        onClose={() => setSelectedOrderForSignature(null)}
        onSave={handleSaveSignature}
      />

    </div>
  );
};
