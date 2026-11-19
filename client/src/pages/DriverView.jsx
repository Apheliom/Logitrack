import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SignaturePadModal } from '../components/Orders/SignaturePadModal';
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
  Send
} from 'lucide-react';

export const DriverView = () => {
  const { user } = useAuth();
  const { sendDriverGPS } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpsActive, setGpsActive] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [selectedOrderForSignature, setSelectedOrderForSignature] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const driverId = user?.driver_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  const loadDriverOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders?driver_id=${driverId}`);
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('[DriverView] Error al cargar órdenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverOrders();
  }, [driverId]);

  // Manejo de la Geolocation API del navegador
  const toggleGpsBroadcast = () => {
    if (gpsActive) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setGpsActive(false);
      setStatusMessage('Transmisión de ubicación en pausa.');
    } else {
      if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización.');
        return;
      }

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // 1. Enviar vía Socket en vivo
          sendDriverGPS({
            driver_id: driverId,
            driver_name: user.full_name,
            lat: latitude,
            lng: longitude
          });

          // 2. Persistir en DB
          try {
            await api.post(`/drivers/${driverId}/location`, {
              lat: latitude,
              lng: longitude
            });
          } catch (e) {
            console.error('Error al guardar ubicación:', e);
          }
        },
        (error) => {
          console.warn('Error GPS:', error.message);
          setStatusMessage('Aviso: Utilizando ubicación predeterminada.');
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      setWatchId(id);
      setGpsActive(true);
      setStatusMessage('Transmitiendo telemetría GPS en tiempo real.');
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: 'IN_TRANSIT'
      });
      if (res.success) {
        setOrders((prev) =>
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
        setOrders((prev) =>
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
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold text-lg shadow-xs">
              <Navigation className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{user?.full_name || 'Conductor'}</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                  {user?.vehicle_type || 'Vehículo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Terminal móvil de entregas y confirmación</p>
            </div>
          </div>

          {/* GPS Broadcast Button */}
          <button
            onClick={toggleGpsBroadcast}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              gpsActive
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <Radio className={`w-4 h-4 ${gpsActive ? 'animate-pulse' : ''}`} />
            <span>{gpsActive ? 'GPS Activo' : 'Transmitir GPS'}</span>
          </button>
        </div>

        {statusMessage && (
          <div className="mt-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 p-2.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Heading & refresh */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900">
            Entregas Asignadas ({orders.length})
          </h2>
        </div>
        <button
          onClick={loadDriverOrders}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 p-10 rounded-3xl text-center text-slate-500 text-sm">
            No tienes órdenes de entrega asignadas en este momento.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  {order.tracking_number}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : order.status === 'IN_TRANSIT'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {order.status === 'DELIVERED'
                    ? 'Entregado'
                    : order.status === 'IN_TRANSIT'
                    ? 'En Ruta'
                    : 'Pendiente'}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{order.client_name}</h3>
                <div className="flex items-start gap-2 text-xs text-slate-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.delivery_address}</span>
                </div>
              </div>

              {order.client_phone && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={`tel:${order.client_phone}`}
                    className="hover:text-blue-600 font-medium underline"
                  >
                    {order.client_phone}
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.dest_lat},${order.dest_lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Navegar</span>
                </a>

                {order.status !== 'DELIVERED' ? (
                  <div className="flex items-center gap-2">
                    {order.status !== 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleStartDelivery(order.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow-xs"
                      >
                        Iniciar Ruta
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrderForSignature(order)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Firmar y Entregar</span>
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Entrega completada</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
