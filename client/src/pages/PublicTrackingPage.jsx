import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
  ArrowRight,
  Star,
  ShieldAlert,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

// Sincronizador dinámico del encuadre del mapa
const MapBoundsUpdater = ({ destCoords, driverCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (destCoords && driverCoords && driverCoords.lat && driverCoords.lng) {
      const bounds = L.latLngBounds([
        [destCoords.lat, destCoords.lng],
        [driverCoords.lat, driverCoords.lng]
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (destCoords && destCoords.lat && destCoords.lng) {
      map.setView([destCoords.lat, destCoords.lng], 14);
    }
  }, [map, destCoords?.lat, destCoords?.lng, driverCoords?.lat, driverCoords?.lng]);
  return null;
};

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

  // Estados para validación de recepción y valoración del cliente
  const [receptionType, setReceptionType] = useState('SELF'); // 'SELF' | 'THIRD_PARTY' | 'NOT_RECEIVED'
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

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

  // Coordenadas actuales del conductor (prioridad: stream socket en vivo > DB)
  const currentDriverCoords = (() => {
    if (!order) return null;
    const liveLoc = order.driver_id ? driverLocations[order.driver_id] : null;
    if (liveLoc && liveLoc.lat && liveLoc.lng) {
      return { lat: Number(liveLoc.lat), lng: Number(liveLoc.lng) };
    }
    if (order.driver_lat && order.driver_lng) {
      return { lat: Number(order.driver_lat), lng: Number(order.driver_lng) };
    }
    return null;
  })();

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!order?.tracking_number) return;
    try {
      setSubmittingFeedback(true);
      const isDispute = receptionType === 'NOT_RECEIVED';
      const res = await api.post(`/orders/track/${order.tracking_number}/feedback`, {
        confirmed_by_client: !isDispute && receptionType === 'SELF',
        relationship: receptionType,
        rating: isDispute ? 1 : feedbackRating,
        feedback: isDispute
          ? (feedbackComment.trim() || 'REPORTE: El cliente afirma no haber firmado ni recibido este pedido (Presunta firma falsificada).')
          : feedbackComment
      });
      if (res.success && res.order) {
        setOrder((prev) => ({ ...prev, ...res.order }));
        setFeedbackSuccessMsg(
          isDispute
            ? 'Reporte de irregularidad emitido. La central de despacho ha sido alertada con la posición del conductor.'
            : 'Confirmación y valoración registradas exitosamente.'
        );
      }
    } catch (err) {
      alert('Error al registrar la confirmación: ' + (err.message || 'Error de red'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

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

            {/* Banner Destacado de Entrega Realizada */}
            {order.status === 'DELIVERED' && (
              <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm space-y-4 animate-in fade-in duration-200 ${
                order.is_disputed || order.reception_relationship === 'NOT_RECEIVED'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-200'
                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 ring-2 ring-emerald-200/60'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                      order.is_disputed || order.reception_relationship === 'NOT_RECEIVED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {order.is_disputed || order.reception_relationship === 'NOT_RECEIVED' ? (
                        <ShieldAlert className="w-7 h-7" />
                      ) : (
                        <CheckCircle2 className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight">
                          {order.is_disputed || order.reception_relationship === 'NOT_RECEIVED'
                            ? 'ENTREGA EN DISPUTA / NO RECONOCIDA'
                            : '¡PEDIDO ENTREGADO CON ÉXITO!'}
                        </h2>
                        <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full uppercase border ${
                          order.is_disputed || order.reception_relationship === 'NOT_RECEIVED'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {order.is_disputed || order.reception_relationship === 'NOT_RECEIVED' ? 'Bajo Auditoría Forense' : 'Completado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {order.delivered_at
                          ? `Entrega consolidada el ${new Date(order.delivered_at).toLocaleDateString()} a las ${new Date(order.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Entrega finalizada y registrada en el sistema de despacho'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-slate-700 shadow-2xs">
                      Receptor: <strong className="text-slate-900">{order.client_name}</strong>
                    </span>
                  </div>
                </div>

                {/* Notificación de discrepancia para el cliente */}
                {(order.is_disputed || order.reception_relationship === 'NOT_RECEIVED') && (
                  <div className="p-4 bg-white/95 border border-rose-200 rounded-2xl text-xs space-y-1.5 text-rose-900 shadow-2xs">
                    <div className="font-bold flex items-center gap-2 text-rose-700 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Alerta de Discrepancia: Paquete no recibido por el titular</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      Has reportado que no recibiste este paquete y no reconoces la firma digital. La administración ha congelado la telemetría GPS del repartidor para auditoría forense inmediata y verificación de ubicación.
                    </p>
                  </div>
                )}
              </div>
            )}

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

                  {/* Auto-encuadre dinámico para mantener ambos puntos visibles conforme se mueve el repartidor */}
                  <MapBoundsUpdater
                    destCoords={{ lat: Number(order.dest_lat), lng: Number(order.dest_lng) }}
                    driverCoords={currentDriverCoords}
                  />

                  {/* Polilínea de aproximación en tiempo real entre el repartidor y el destino */}
                  {currentDriverCoords && order.dest_lat && order.dest_lng && (
                    <>
                      {/* Sombra de alto contraste */}
                      <Polyline
                        positions={[
                          [currentDriverCoords.lat, currentDriverCoords.lng],
                          [Number(order.dest_lat), Number(order.dest_lng)]
                        ]}
                        pathOptions={{
                          color: '#0f172a',
                          weight: 6,
                          opacity: 0.25,
                          dashArray: '8, 8'
                        }}
                      />
                      {/* Trazo activo azul vibrante */}
                      <Polyline
                        positions={[
                          [currentDriverCoords.lat, currentDriverCoords.lng],
                          [Number(order.dest_lat), Number(order.dest_lng)]
                        ]}
                        pathOptions={{
                          color: '#2563eb',
                          weight: 4,
                          opacity: 0.9,
                          dashArray: '6, 6'
                        }}
                      />
                    </>
                  )}

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
                            Repartidor: {order.driver_name || 'En camino'}
                          </strong>
                          <span className="text-slate-600">Aproximándose en tiempo real</span>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>

            {/* Proof of Delivery (Firma) y Validación de Recepción por el Cliente */}
            {(order.status === 'DELIVERED' || order.signature_data) && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Comprobante de Entrega Digital (POD)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Firma digitalizada registrada al momento de la entrega física del pedido:
                  </p>
                  {order.signature_data ? (
                    <div className="mt-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block">
                      <img
                        src={order.signature_data}
                        alt="Firma del receptor"
                        className="max-h-28 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400 italic">
                      Firma en proceso de sincronización.
                    </div>
                  )}
                </div>

                {/* Confirmación y Calificación del Cliente */}
                <div className="pt-5 border-t border-slate-100">
                  {order.client_confirmed_received !== null && order.client_confirmed_received !== undefined ? (
                    <div className={`rounded-2xl p-4 sm:p-5 space-y-3 border ${
                      order.is_disputed || order.reception_relationship === 'NOT_RECEIVED'
                        ? 'bg-rose-50/80 border-rose-300'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold flex items-center gap-2">
                          {order.is_disputed || order.reception_relationship === 'NOT_RECEIVED' ? (
                            <>
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                              <span className="text-rose-900">Auditoría por Discrepancia de Entrega Registrada</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="text-slate-800">Validación de Recepción Completada</span>
                            </>
                          )}
                        </span>
                        {order.client_feedback_at && (
                          <span className="text-[11px] text-slate-400">
                            {new Date(order.client_feedback_at).toLocaleDateString()} a las {new Date(order.client_feedback_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className={`p-3 bg-white rounded-xl border ${
                          order.is_disputed || order.reception_relationship === 'NOT_RECEIVED'
                            ? 'border-rose-200'
                            : 'border-slate-100'
                        }`}>
                          <span className="text-slate-400 font-medium block">Recepción declarada:</span>
                          <span className={`font-semibold mt-0.5 block ${
                            order.is_disputed || order.reception_relationship === 'NOT_RECEIVED'
                              ? 'text-rose-700 font-bold'
                              : 'text-slate-800'
                          }`}>
                            {order.reception_relationship === 'NOT_RECEIVED' || order.is_disputed
                              ? '¡Reportado como NO recibido por el cliente!'
                              : order.client_confirmed_received
                              ? 'Confirmado personalmente por el titular'
                              : 'Recibido por un tercero / familiar autorizado'}
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-medium block">Calificación de Servicio:</span>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (order.client_rating || 5)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-1.5">
                              {order.client_rating || 5}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      {order.client_feedback && (
                        <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs">
                          <span className="text-slate-400 font-medium block">Comentario u observación registrada:</span>
                          <p className="text-slate-700 font-medium mt-1">"{order.client_feedback}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Validación de Entrega y Calificación de Servicio
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Confirma si recibiste tu pedido o reporta cualquier irregularidad con la firma digitalizada.
                        </p>
                      </div>

                      {feedbackSuccessMsg && (
                        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                          receptionType === 'NOT_RECEIVED'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          {receptionType === 'NOT_RECEIVED' ? (
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span>{feedbackSuccessMsg}</span>
                        </div>
                      )}

                      {/* Selección de receptor en 3 opciones */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-2">
                          ¿Quién recibió físicamente el paquete y firmó?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Opción 1: Personal */}
                          <button
                            type="button"
                            onClick={() => {
                              setReceptionType('SELF');
                              if (feedbackRating === 1) setFeedbackRating(5);
                            }}
                            className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                              receptionType === 'SELF'
                                ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-100 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="block font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Fui yo personalmente</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal leading-tight block">
                              Reconozco la firma y recibí los productos conforme.
                            </span>
                          </button>

                          {/* Opción 2: Tercero */}
                          <button
                            type="button"
                            onClick={() => {
                              setReceptionType('THIRD_PARTY');
                              if (feedbackRating === 1) setFeedbackRating(5);
                            }}
                            className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                              receptionType === 'THIRD_PARTY'
                                ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-100 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="block font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-amber-600" />
                              <span>Tercero autorizado</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal leading-tight block">
                              Familiar, recepción o compañero de trabajo en mi lugar.
                            </span>
                          </button>

                          {/* Opción 3: Disputa / No Recibido */}
                          <button
                            type="button"
                            onClick={() => {
                              setReceptionType('NOT_RECEIVED');
                              setFeedbackRating(1);
                            }}
                            className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                              receptionType === 'NOT_RECEIVED'
                                ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-200 shadow-xs'
                                : 'bg-white border-rose-200/80 text-rose-700 hover:bg-rose-50/50'
                            }`}
                          >
                            <span className="block font-bold text-rose-700 mb-0.5 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span>¡Yo NO lo recibí!</span>
                            </span>
                            <span className="text-[11px] text-rose-600/80 font-normal leading-tight block">
                              Desconozco la entrega y la firma no es mía ni de nadie autorizado.
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Cuadro de Advertencia si reporta No Recibido */}
                      {receptionType === 'NOT_RECEIVED' && (
                        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs space-y-1 text-rose-900 animate-in fade-in duration-150">
                          <div className="font-bold flex items-center gap-1.5 text-rose-700">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Protocolo de Seguridad y Auditoría Forense</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-rose-800">
                            Al emitir este reporte, el sistema notificará de inmediato al Administrador de Despacho y enviará un aviso de auditoría urgente al terminal del repartidor. Se congelará la posición satelital del repartidor para verificar la ruta recorrida.
                          </p>
                        </div>
                      )}

                      {/* Calificación de Estrellas (solo si no es disputa) */}
                      {receptionType !== 'NOT_RECEIVED' ? (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                            Calificación del servicio:
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRating(star)}
                                className="p-1 hover:scale-110 transition-transform focus:outline-hidden"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= feedbackRating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-2">
                              {feedbackRating} de 5 estrellas
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Comentario */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          {receptionType === 'NOT_RECEIVED'
                            ? 'Detalles de la irregularidad (Opcional):'
                            : 'Comentario u observación (Opcional):'}
                        </label>
                        <textarea
                          rows={2}
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder={
                            receptionType === 'NOT_RECEIVED'
                              ? 'Ej: El chofer marcó entregado pero no estuvo en mi dirección...'
                              : 'Ej: Entrega puntual y excelente trato...'
                          }
                          className={`w-full text-xs p-3 rounded-xl border focus:outline-hidden focus:ring-2 ${
                            receptionType === 'NOT_RECEIVED'
                              ? 'border-rose-200 focus:ring-rose-500/20 focus:border-rose-500'
                              : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 ${
                          receptionType === 'NOT_RECEIVED'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {receptionType === 'NOT_RECEIVED' ? (
                          <>
                            <ShieldAlert className="w-4 h-4" />
                            <span>{submittingFeedback ? 'Emitiendo reporte...' : 'Emitir Reporte de Entrega No Recibida'}</span>
                          </>
                        ) : (
                          <span>{submittingFeedback ? 'Guardando...' : 'Enviar Confirmación y Valoración'}</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
