import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { LiveFleetMap } from '../components/Map/LiveFleetMap';
import { CreateOrderModal } from '../components/Orders/CreateOrderModal';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Play,
  Square,
  Zap,
  Plus,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [simulatorStatus, setSimulatorStatus] = useState({ isRunning: false });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriverForRoute, setSelectedDriverForRoute] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationMsg, setOptimizationMsg] = useState(null);

  const { socket } = useSocket();

  // Carga paralela de datos (Eliminación de Waterfalls según .agent-skills)
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, driversRes, routesRes, simRes] = await Promise.all([
        api.get('/orders'),
        api.get('/drivers'),
        api.get('/routes/active'),
        api.get('/routes/simulator/status')
      ]);

      if (ordersRes.success) setOrders(ordersRes.orders || []);
      if (driversRes.success) {
        setDrivers(driversRes.drivers || []);
        if (driversRes.drivers.length > 0 && !selectedDriverForRoute) {
          setSelectedDriverForRoute(driversRes.drivers[0].id);
        }
      }
      if (routesRes.success && routesRes.routes.length > 0) {
        setActiveRoute(routesRes.routes[0]);
      }
      if (simRes.success) setSimulatorStatus(simRes.simulator);
    } catch (err) {
      console.error('[AdminDashboard] Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Suscripción a eventos de socket para actualización en tiempo real
    if (socket) {
      socket.on('order:created', (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
      });

      socket.on('order:updated', (updatedOrder) => {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === updatedOrder.id ? { ...ord, ...updatedOrder } : ord))
        );
      });

      socket.on('route:generated', ({ route }) => {
        setActiveRoute(route);
      });
    }

    return () => {
      if (socket) {
        socket.off('order:created');
        socket.off('order:updated');
        socket.off('route:generated');
      }
    };
  }, [socket]);

  // Manejo del simulador GPS
  const handleToggleSimulator = async () => {
    try {
      const res = await api.post('/routes/simulator/toggle', {
        action: simulatorStatus.isRunning ? 'stop' : 'start'
      });
      if (res.success) {
        setSimulatorStatus(res.simulator);
      }
    } catch (err) {
      alert('Error al controlar simulador: ' + err.message);
    }
  };

  // Ejecutar optimización de ruta con algoritmo 2-opt
  const handleOptimizeRoute = async () => {
    if (!selectedDriverForRoute) {
      alert('Seleccione un repartidor para generar la ruta optimizada.');
      return;
    }
    setOptimizing(true);
    setOptimizationMsg(null);
    try {
      const res = await api.post('/routes/optimize', {
        driver_id: selectedDriverForRoute
      });
      if (res.success) {
        setActiveRoute(res.route);
        setOptimizationMsg(`Ruta optimizada: ${res.summary.totalDistanceKm} km (~${res.summary.estimatedDurationMinutes} min)`);
        loadDashboardData();
      }
    } catch (err) {
      setOptimizationMsg(`Fallo: ${err.message}`);
    } finally {
      setOptimizing(false);
    }
  };

  // Métricas calculadas
  const metrics = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    inTransit: orders.filter((o) => o.status === 'IN_TRANSIT').length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    availableDrivers: drivers.filter((d) => d.is_available).length
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner & Control Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Centro de Despacho y Telemetría</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              En Vivo
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimización de rutas con algoritmo 2-opt (TSP) y monitoreo de flota en tiempo real.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón Simulador GPS (Clave para demostración académica) */}
          <button
            onClick={handleToggleSimulator}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-lg ${
              simulatorStatus.isRunning
                ? 'bg-rose-950/60 border-rose-700 text-rose-300 hover:bg-rose-900/60'
                : 'bg-indigo-950/60 border-indigo-700 text-indigo-300 hover:bg-indigo-900/60'
            }`}
            title="Simula movimiento de repartidores en las calles sin GPS real"
          >
            {simulatorStatus.isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Detener Simulación GPS</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                <span>Activar Simulación GPS</span>
              </>
            )}
          </button>

          {/* Botón Crear Orden */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Entrega</span>
          </button>

          {/* Botón Refrescar */}
          <button
            onClick={loadDashboardData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Órdenes Totales</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Pendientes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{metrics.pending}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium">
            <span>En Tránsito</span>
            <Truck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-1">{metrics.inTransit}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Entregados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{metrics.delivered}</div>
        </div>
      </div>

      {/* Main Content: Map & Route Optimization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Leaflet Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Mapa de Telemetría y Rutas de Flota</span>
            </h2>
            <div className="text-xs text-slate-400">
              {drivers.length} Vehículos monitoreados
            </div>
          </div>

          <LiveFleetMap
            orders={orders}
            drivers={drivers}
            activeRoute={activeRoute}
            center={[4.6534, -74.0836]}
            zoom={13}
          />
        </div>

        {/* Right Col: Route Optimization Box & Driver Status */}
        <div className="space-y-4">
          
          {/* Route Optimization Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>Motor de Optimización (2-opt)</span>
            </div>
            <p className="text-xs text-slate-400">
              Calcula el orden óptimo de paradas para minimizar distancia recorrida y tiempo de entrega.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Seleccionar Conductor:
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                value={selectedDriverForRoute}
                onChange={(e) => setSelectedDriverForRoute(e.target.value)}
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.vehicle_type} - {d.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOptimizeRoute}
              disabled={optimizing}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{optimizing ? 'Calculando 2-opt...' : 'Calcular Ruta Óptima'}</span>
            </button>

            {optimizationMsg && (
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-indigo-300">
                {optimizationMsg}
              </div>
            )}
          </div>

          {/* Drivers List Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Estado de Repartidores
            </h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{driver.full_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {driver.vehicle_type} • Placa: {driver.license_plate}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      driver.status === 'ON_DELIVERY'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : driver.status === 'IDLE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {driver.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Orders Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Listado de Órdenes y Entregas</h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-xl text-xs">
            {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterStatus === st
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Repartidor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Rastreo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    No se encontraron órdenes para este filtro.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {order.tracking_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{order.client_name}</td>
                    <td className="px-4 py-3 text-slate-400 truncate max-w-xs">
                      {order.delivery_address}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.priority === 'URGENT'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {order.driver_name || (
                        <span className="text-slate-500 italic">No asignado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/track/${order.tracking_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                      >
                        Ver Tracking →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Orden */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderCreated={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
        }}
        drivers={drivers}
      />

    </div>
  );
};
