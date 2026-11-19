import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  MapPin,
  Calendar,
  FileCheck
} from 'lucide-react';

const destinationIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="background-color: #ef4444; color: white; border: 2px solid #fff; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.4);">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const driverLiveIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="background-color: #10b981; color: white; border: 2px solid #fff; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.4); animation: pulse 2s infinite;">🛵</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Search Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">Rastreo de Paquetes LogiTrack</h1>
        <p className="text-xs text-slate-400">
          Consulta el estado de tu envío y la posición de tu repartidor en tiempo real.
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="Ej. TRK-2026-001"
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 transition"
          >
            Rastrear
          </button>
        </form>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 text-sm">
          Cargando telemetría de envío...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-center text-sm">
          {error}
        </div>
      )}

      {order && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Order Details Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Número de Guía</span>
                <div className="text-lg font-mono font-bold text-emerald-400">
                  {order.tracking_number}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Destinatario:</span>
                <span className="text-sm font-semibold text-white">{order.client_name}</span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="text-center space-y-1.5">
                    <div
                      className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-emerald-800 text-emerald-200'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        isPassed ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="hidden sm:block text-[10px] text-slate-400 leading-tight">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-semibold">Dirección de Entrega:</span>
                  <span className="text-slate-200">{order.delivery_address}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-semibold">Repartidor Asignado:</span>
                  <span className="text-slate-200">
                    {order.driver_name
                      ? `${order.driver_name} (${order.vehicle_type} - ${order.license_plate})`
                      : 'Esperando asignación'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Ubicación del Envío en Mapa</span>
              </span>
              {order.status === 'IN_TRANSIT' && (
                <span className="text-emerald-400 text-[11px] font-semibold">
                  Repartidor en movimiento
                </span>
              )}
            </div>

            <div className="w-full h-[360px] rounded-xl overflow-hidden border border-slate-800">
              <MapContainer
                center={[Number(order.dest_lat), Number(order.dest_lng)]}
                zoom={14}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Marcador del Destino */}
                <Marker
                  position={[Number(order.dest_lat), Number(order.dest_lng)]}
                  icon={destinationIcon}
                >
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-rose-400 block">Tu Dirección</strong>
                      <span>{order.delivery_address}</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Marcador del Conductor si está en tránsito */}
                {currentDriverCoords && (
                  <Marker
                    position={[currentDriverCoords.lat, currentDriverCoords.lng]}
                    icon={driverLiveIcon}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-emerald-400 block">
                          Repartidor: {order.driver_name}
                        </strong>
                        <span>Tu paquete va en camino</span>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>

          {/* Digital Signature Proof Card if Delivered */}
          {order.signature_data && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <FileCheck className="w-5 h-5" />
                <span>Comprobante de Entrega Digital (POD)</span>
              </div>
              <p className="text-xs text-slate-400">
                Firma registrada en el momento de la recepción física del paquete:
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 inline-block">
                <img
                  src={order.signature_data}
                  alt="Firma del receptor"
                  className="max-h-28 rounded filter invert brightness-125"
                />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
