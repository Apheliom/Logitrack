import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LogiTrackLogo } from '../components/Brand/LogiTrackLogo';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  MapPin,
  Calendar,
  FileCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const destinationIcon = L.divIcon({
  className: 'custom-destination-marker',
  html: `
    <div style="position: relative; width: 34px; height: 40px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));">
      <svg viewBox="0 0 32 38" width="34" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 22 16 22s16-11.5 16-22C32 7.163 24.837 0 16 0z" fill="#ef4444"/>
        <circle cx="16" cy="15" r="9" fill="#ffffff"/>
        <circle cx="16" cy="15" r="4.5" fill="#ef4444"/>
      </svg>
    </div>
  `,
  iconSize: [34, 40],
  iconAnchor: [17, 40]
});

const driverLiveIcon = L.divIcon({
  className: 'custom-live-driver-marker',
  html: `
    <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        inset: 0px;
        border-radius: 9999px;
        background: rgba(16, 185, 129, 0.25);
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 9999px;
        background: #ffffff;
        border: 2.5px solid #10b981;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

export const PublicTrackingPage = () => {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState(trackingNumber || '');
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { socket, subscribeToOrder, unsubscribeFromOrder, driverLocations } = useSocket();

  const fetchTracking = async (code) => {
    if (!code) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/orders/track/${code.trim()}`);
      if (res.success) {
        setOrder(res.order);
        setHistory(res.history || []);
        subscribeToOrder(code.trim());
      }
    } catch (err) {
      setError(err.message || 'No se encontró la orden con ese código.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingNumber) {
      setSearchCode(trackingNumber);
      fetchTracking(trackingNumber);
    }
    return () => {
      if (trackingNumber) {
        unsubscribeFromOrder(trackingNumber);
      }
    };
  }, [trackingNumber]);

  useEffect(() => {
    if (socket) {
      socket.on('tracking:order_update', (updatedOrder) => {
        setOrder((prev) => (prev ? { ...prev, ...updatedOrder } : updatedOrder));
      });
    }
    return () => {
      if (socket) {
        socket.off('tracking:order_update');
      }
    };
  }, [socket]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      navigate(`/track/${searchCode.trim()}`);
    }
  };

  // Coordenadas actuales del conductor (vía socket o DB)
  const currentDriverCoords = order && order.driver_lat && order.driver_lng ? {
    lat: driverLocations[order.driver_id]?.lat || Number(order.driver_lat),
    lng: driverLocations[order.driver_id]?.lng || Number(order.driver_lng)
  } : null;

  const steps = [
    { key: 'PENDING', label: 'Registrado', desc: 'Orden recibida en el centro logístico.' },
    { key: 'ASSIGNED', label: 'Asignado', desc: 'Repartidor asignado para despacho.' },
    { key: 'IN_TRANSIT', label: 'En Ruta', desc: 'El repartidor va camino a la dirección.' },
    { key: 'DELIVERED', label: 'Entregado', desc: 'Paquete entregado y firmado.' }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'ASSIGNED': return 1;
      case 'IN_TRANSIT': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-xs text-center space-y-4">
          <div className="inline-flex justify-center mb-1">
            <LogiTrackLogo size="lg" variant="full" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Rastreo de Envíos en Tiempo Real
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Ingresa tu número de guía para monitorear el progreso de entrega y la posición exacta de tu vehículo.
          </p>

          <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Ej. TRK-2026-001"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              Consultar
            </button>
          </form>
        </div>

        {loading && (
          <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Consultando telemetría...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center text-sm">
            {error}
          </div>
        )}

        {order && !loading && (
          <div className="space-y-6">

            {/* Status Stepper Card */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Número de Guía
                  </span>
                  <div className="text-xl font-mono font-bold text-blue-600">
                    {order.tracking_number}
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Destinatario
                  </span>
                  <span className="text-base font-semibold text-slate-900">{order.client_name}</span>
                </div>
              </div>

              {/* Steps Progress */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {steps.map((step, idx) => {
                  const isPassed = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.key} className="text-center space-y-1.5">
                      <div
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isPassed && idx < currentStepIdx ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className={`text-xs font-semibold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </div>
                      <div className="hidden sm:block text-[11px] text-slate-500 leading-tight">
                        {step.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-semibold block">Dirección de Entrega:</span>
                    <span className="text-slate-800 font-medium">{order.delivery_address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <Truck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-semibold block">Repartidor Asignado:</span>
                    <span className="text-slate-800 font-medium">
                      {order.driver_name
                        ? `${order.driver_name} (${order.vehicle_type} - ${order.license_plate || 'Sin Placa'})`
                        : 'En espera de despacho'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Card */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Seguimiento Geoespacial en Vivo</span>
                </span>
                {order.status === 'IN_TRANSIT' && (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    Vehículo en aproximación
                  </span>
                )}
              </div>

              <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-slate-200">
                <MapContainer
                  center={[Number(order.dest_lat), Number(order.dest_lng)]}
                  zoom={14}
                  className="w-full h-full"
                >
                  {/* Clean OpenStreetMap Tiles — 100% libre sin watermarks */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />

                  {/* Destino */}
                  <Marker
                    position={[Number(order.dest_lat), Number(order.dest_lng)]}
                    icon={destinationIcon}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-slate-900 block font-semibold">Destino de Entrega</strong>
                        <span className="text-slate-600">{order.delivery_address}</span>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Conductor en vivo */}
                  {currentDriverCoords && (
                    <Marker
                      position={[currentDriverCoords.lat, currentDriverCoords.lng]}
                      icon={driverLiveIcon}
                    >
                      <Popup>
                        <div className="text-xs p-1">
                          <strong className="text-emerald-700 block font-semibold">
                            Repartidor: {order.driver_name}
                          </strong>
                          <span className="text-slate-600">Aproximándose a tu ubicación</span>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>

            {/* Proof of Delivery (Firma) */}
            {order.signature_data && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Comprobante de Entrega Digital (POD)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Firma digitalizada capturada al momento de la recepción física del pedido:
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block">
                  <img
                    src={order.signature_data}
                    alt="Firma del receptor"
                    className="max-h-28 rounded-lg"
                  />
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
