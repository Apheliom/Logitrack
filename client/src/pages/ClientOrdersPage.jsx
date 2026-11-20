import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/UI/Badge';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  MapPin,
  RotateCw,
  FileCheck
} from 'lucide-react';

export const ClientOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('[ClientOrdersPage Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
            Portal de Cliente
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Mis Pedidos y Envíos en Curso
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consulta el progreso de entrega de cada paquete que has ordenado en la tienda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
            title="Actualizar"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/store"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ir a la Tienda</span>
          </Link>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Cargando tus paquetes...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Aún no tienes pedidos registrados</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ingresa al catálogo online, agrega tus productos favoritos y podrás seguir aquí su entrega en vivo.
              </p>
            </div>
            <Link
              to="/store"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition"
            >
              <span>Explorar Tienda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Número de Guía
                  </span>
                  <div className="text-base font-mono font-bold text-blue-600 mt-0.5">
                    {order.tracking_number}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={order.status} />
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Detalle del Pedido:</span>
                  <p className="text-slate-800 font-medium">{order.delivery_notes || 'Pedido Express'}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Destino:</span>
                  <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{order.delivery_address}</span>
                  </div>
                </div>
              </div>

              {/* CTA footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {order.driver_name ? (
                    <span className="text-slate-600 font-medium">
                      Conductor asignado: <strong>{order.driver_name}</strong>
                    </span>
                  ) : (
                    <span>En espera de asignación de vehículo</span>
                  )}
                </div>

                <Link
                  to={`/track/${order.tracking_number}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <span>Rastrear en Vivo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
