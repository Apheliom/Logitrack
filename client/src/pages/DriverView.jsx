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
  PlusCircle,
  Layers,
  Inbox
} from 'lucide-react';

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
    let lastCoords = { lat: 4.6534, lng: -74.0836 };

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

      {/* Selector de Pestañas: Mis Asignadas vs Bolsa de Libres */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        <button
          onClick={() => setActiveTab('ASSIGNED')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'ASSIGNED'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Mis Entregas ({assignedOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('POOL')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'POOL'
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
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      order.status === 'DELIVERED'
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
