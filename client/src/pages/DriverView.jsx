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
  ShieldCheck
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
      setStatusMessage('Transmisión GPS pausada.');
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
          setStatusMessage('Aviso GPS: Usando simulación de coordenadas.');
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      setWatchId(id);
      setGpsActive(true);
      setStatusMessage('🛰️ Transmitiendo coordenadas GPS en vivo.');
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      
      {/* Driver Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Panel Móvil</span>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{user?.full_name || 'Conductor'}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {user?.vehicle_type || 'Moto'}
              </span>
            </h1>
          </div>

          {/* GPS Broadcast Button */}
          <button
            onClick={toggleGpsBroadcast}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              gpsActive
                ? 'bg-emerald-600 text-white shadow-emerald-950 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{gpsActive ? 'GPS Activo' : 'Activar GPS'}</span>
          </button>
        </div>

        {statusMessage && (
          <div className="mt-3 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/60">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Orders Heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          <span>Mis Entregas Asignadas ({orders.length})</span>
        </h2>
        <button
          onClick={loadDriverOrders}
          className="text-xs text-indigo-400 hover:underline"
        >
          Actualizar lista
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-sm">
            No tienes entregas pendientes asignadas en este momento.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {order.tracking_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : order.status === 'IN_TRANSIT'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-white text-sm">{order.client_name}</h3>
                <div className="flex items-start gap-1.5 text-xs text-slate-300 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{order.delivery_address}</span>
                </div>
              </div>

              {order.client_phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <a
                    href={`tel:${order.client_phone}`}
                    className="hover:text-emerald-400 underline"
                  >
                    {order.client_phone}
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                {/* External Maps link */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.dest_lat},${order.dest_lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Navegar</span>
                </a>

                {order.status !== 'DELIVERED' ? (
                  <div className="flex items-center gap-2">
                    {order.status !== 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleStartDelivery(order.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                      >
                        Iniciar Ruta
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrderForSignature(order)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Firmar y Entregar</span>
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
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
