import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { LiveFleetMap } from '../components/Map/LiveFleetMap';
import { CreateOrderModal } from '../components/Orders/CreateOrderModal';
import { Badge } from '../components/UI/Badge';
import { MetricCard } from '../components/UI/MetricCard';
import {
  Package, Truck, CheckCircle2, Clock, Play, Square,
  Plus, RefreshCw, ArrowUpRight, ArrowRight, Search, Filter, ShoppingBag,
  AlertTriangle, ShieldAlert
} from 'lucide-react';

export const AdminDashboard = () => {
  const [orders,  setOrders]  = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [mapFilterDriver, setMapFilterDriver] = useState('ALL');
  const [mapSearch, setMapSearch] = useState('');
  const [disputeAlerts, setDisputeAlerts] = useState([]);
  const { socket } = useSocket();

  const loadAll = async () => {
    try {
      setLoading(true);
      const [oRes, dRes, rRes, sRes] = await Promise.all([
        api.get('/orders'),
        api.get('/drivers'),
        api.get('/routes/active'),
        api.get('/routes/simulator/status'),
      ]);
      if (oRes.success) setOrders(oRes.orders || []);
      if (dRes.success) setDrivers(dRes.drivers || []);
      if (rRes.success && rRes.routes.length) setActiveRoute(rRes.routes[0]);
      if (sRes.success) setSimRunning(sRes.simulator.isRunning);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadAll();
    if (socket) {
      socket.on('order:created',  o => setOrders(p => [o, ...p]));
      socket.on('order:updated',  o => setOrders(p => p.map(x => x.id === o.id ? { ...x, ...o } : x)));
      socket.on('route:generated', ({ route }) => setActiveRoute(route));
      socket.on('alert:delivery_dispute', (alertData) => {
        setDisputeAlerts(prev => [alertData, ...prev]);
      });
    }
    return () => {
      if (socket) {
        socket.off('order:created');
        socket.off('order:updated');
        socket.off('route:generated');
        socket.off('alert:delivery_dispute');
      }
    };
  }, [socket]);

  const toggleSim = async () => {
    const r = await api.post('/routes/simulator/toggle', { action: simRunning ? 'stop' : 'start' });
    if (r.success) setSimRunning(r.simulator.isRunning);
  };

  const metrics = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'PENDING').length,
    transit:   orders.filter(o => o.status === 'IN_TRANSIT').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  const filtered = orders.filter(o => filterStatus === 'ALL' || o.status === filterStatus);

  // Filtros dinámicos para el mapa (por estado, chofer y búsqueda de producto/cliente)
  const mapFilteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Filtro por estado
      if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
      // Filtro por chofer asignado
      if (mapFilterDriver === 'UNASSIGNED') {
        if (o.assigned_driver_id) return false;
      } else if (mapFilterDriver !== 'ALL') {
        if (o.assigned_driver_id !== mapFilterDriver) return false;
      }
      // Filtro por producto, cliente, guía o dirección
      if (mapSearch.trim()) {
        const q = mapSearch.toLowerCase();
        const matchesClient = o.client_name?.toLowerCase().includes(q);
        const matchesTracking = o.tracking_number?.toLowerCase().includes(q);
        const matchesAddress = o.delivery_address?.toLowerCase().includes(q);
        const matchesProduct = Array.isArray(o.order_items) && o.order_items.some(it =>
          (it.name && it.name.toLowerCase().includes(q)) || (it.category && it.category.toLowerCase().includes(q))
        );
        if (!matchesClient && !matchesTracking && !matchesAddress && !matchesProduct) return false;
      }
      return true;
    });
  }, [orders, filterStatus, mapFilterDriver, mapSearch]);

  const mapFilteredDrivers = useMemo(() => {
    if (mapFilterDriver === 'UNASSIGNED') return [];
    if (mapFilterDriver === 'ALL') return drivers;
    return drivers.filter(d => d.id === mapFilterDriver);
  }, [drivers, mapFilterDriver]);

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-6 space-y-6">

      {/* Alertas Críticas de Entrega Disputada / Falsificación de Firma */}
      {disputeAlerts.map((alt, idx) => (
        <div key={idx} className="bg-rose-50 border-2 border-rose-400 p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">¡Alerta Crítica: Entrega Disputada por Cliente!</span>
                <span className="text-[10px] font-mono font-bold bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">{alt.tracking_number}</span>
              </div>
              <p className="text-xs text-rose-900 mt-1 font-medium leading-relaxed">
                El cliente <strong className="font-bold">{alt.client_name}</strong> ({alt.client_phone}) declara formalmente <strong>NO HABER RECIBIDO</strong> el pedido y no reconocer la firma registrada.
              </p>
              <div className="text-[11px] text-rose-700 font-medium mt-1 flex flex-wrap gap-x-3">
                <span>Chofer Asignado: <strong>{alt.driver_name}</strong> ({alt.driver_phone || 'Sin teléfono'})</span>
                <span>•</span>
                <span>Coordenadas GPS Congeladas: <strong>{alt.driver_lat?.toFixed(4)}, {alt.driver_lng?.toFixed(4)}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {alt.driver_lat && alt.driver_lng && (
              <button
                onClick={() => {
                  setMapSearch(alt.tracking_number);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Rastrear en Mapa
              </button>
            )}
            <button
              onClick={() => setDisputeAlerts(prev => prev.filter((_, i) => i !== idx))}
              className="px-3.5 py-2 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-xl transition"
            >
              Atendido
            </button>
          </div>
        </div>
      ))}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-primary tracking-tight">Centro de Despacho</h1>
          <p className="text-sm text-ink-tertiary mt-0.5">Monitoreo en tiempo real · Optimización 2-opt</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleSim} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition ${simRunning ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-white border-surface-3 text-ink-secondary hover:bg-surface-2'}`}>
            {simRunning ? <><Square className="w-3.5 h-3.5 fill-current" /> Detener simulación</> : <><Play className="w-3.5 h-3.5 fill-current" /> Simular GPS</>}
          </button>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-sm transition">
            <Plus className="w-4 h-4" strokeWidth={2} />
            Nueva entrega
          </button>
          <button onClick={loadAll} className={`p-2 rounded-xl border border-surface-3 bg-white hover:bg-surface-2 text-ink-tertiary transition ${loading ? 'animate-spin' : ''}`} title="Recargar">
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard title="Total Órdenes" value={metrics.total} icon={Package} variant="default" subtitle="En base de datos" />
        <MetricCard title="Pendientes" value={metrics.pending} icon={Clock} variant="amber" subtitle="En cola de despacho" />
        <MetricCard title="En Tránsito" value={metrics.transit} icon={Truck} variant="sky" subtitle="Repartidores en ruta" />
        <MetricCard title="Entregadas" value={metrics.delivered} icon={CheckCircle2} variant="emerald" subtitle="Confirmadas con firma" />
      </div>

      {/* Map + Route optimizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mapa de Flota en Tiempo Real</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                {mapFilteredOrders.length} Paradas · {mapFilteredDrivers.length} Conductores
              </span>
            </div>
          </div>

          {/* Barra de Filtros Interactiva (Pedidos, Choferes, Productos) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Buscador de Producto / Cliente / Guía */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por producto, cliente o guía..."
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Selector de Conductor */}
            <div className="relative">
              <select
                value={mapFilterDriver}
                onChange={(e) => setMapFilterDriver(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos los Choferes ({drivers.length})</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name} ({d.vehicle_type})</option>
                ))}
                <option value="UNASSIGNED">Sin Conductor Asignado</option>
              </select>
            </div>

            {/* Selector de Estado de Pedido */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PENDING">Pendientes de Despacho</option>
                <option value="IN_TRANSIT">En Tránsito / Ruta</option>
                <option value="DELIVERED">Entregados</option>
              </select>
            </div>
          </div>

          <LiveFleetMap
            orders={mapFilteredOrders}
            drivers={mapFilteredDrivers}
            activeRoute={filterStatus === 'PENDING' || filterStatus === 'DELIVERED' ? null : activeRoute}
            center={[10.0305, -69.2635]}
            zoom={13}
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick Fleet & Driver Management Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Truck className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Control de Flota</h3>
                  <p className="text-[11px] text-slate-500">Rutas 2-opt calculadas en tiempo real</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-Ruta
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Almacén Central:</span>
                <span className="font-semibold text-slate-900">Cabudare Centro</span>
              </div>
              <div className="flex justify-between">
                <span>Algoritmo Activo:</span>
                <span className="font-semibold text-blue-700">Heurística 2-Opt Automática</span>
              </div>
            </div>

            <Link
              to="/admin/drivers"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs rounded-xl transition shadow-xs"
            >
              <span>Ver Rendimiento y Modificar Choferes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Drivers status */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Estado de Conductores</span>
              <span className="text-[11px] font-normal text-slate-500">({drivers.length} activos)</span>
            </h3>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {drivers.map(d => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{d.full_name}</div>
                    <div className="text-[11px] text-slate-500">{d.vehicle_type} · {d.license_plate}</div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${d.status === 'ON_DELIVERY' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {d.status === 'ON_DELIVERY' ? 'En ruta' : 'Disponible'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/90 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Listado de Órdenes y Envíos</h3>
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl text-xs shadow-2xs">
            {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'Todos' : s === 'IN_TRANSIT' ? 'En Tránsito' : s === 'DELIVERED' ? 'Entregados' : 'Pendientes'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Guía / Tracking</th>
                <th className="px-6 py-3.5">Cliente</th>
                <th className="px-6 py-3.5 hidden md:table-cell">Dirección de Destino</th>
                <th className="px-6 py-3.5">Prioridad</th>
                <th className="px-6 py-3.5 hidden sm:table-cell">Repartidor</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-right">Rastreo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No hay órdenes para este filtro.</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{o.tracking_number}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{o.client_name}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs hidden md:table-cell max-w-[220px] truncate">{o.delivery_address}</td>
                  <td className="px-6 py-4"><Badge variant={o.priority} /></td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700 hidden sm:table-cell">{o.driver_name || <span className="text-slate-400 italic">Sin asignar</span>}</td>
                  <td className="px-6 py-4"><Badge variant={o.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/track/${o.tracking_number}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <span>Ver</span>
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onOrderCreated={o => setOrders(p => [o, ...p])} drivers={drivers} />
    </div>
  );
};
