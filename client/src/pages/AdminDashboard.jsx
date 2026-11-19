import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { LiveFleetMap } from '../components/Map/LiveFleetMap';
import { CreateOrderModal } from '../components/Orders/CreateOrderModal';
import {
  Package, Truck, CheckCircle2, Clock, Play, Square,
  Zap, Plus, RefreshCw, ArrowUpRight
} from 'lucide-react';

// --- Sub-components ---

const StatCard = ({ label, value, icon: Icon, color = 'text-slate-900', bgColor = 'bg-slate-50' }) => (
  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={`p-2 rounded-xl ${bgColor} border border-slate-100`}>
        <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
      </div>
    </div>
    <div className={`text-2xl font-bold tabular-nums tracking-tight ${color}`}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:    { label: 'Pendiente',    className: 'bg-amber-50 text-amber-800 border-amber-300/80' },
    ASSIGNED:   { label: 'Asignado',     className: 'bg-sky-50 text-sky-800 border-sky-300/80' },
    IN_TRANSIT: { label: 'En tránsito',  className: 'bg-indigo-50 text-indigo-800 border-indigo-300/80' },
    DELIVERED:  { label: 'Entregado',    className: 'bg-emerald-50 text-emerald-800 border-emerald-300/80' },
    FAILED:     { label: 'Fallido',      className: 'bg-rose-50 text-rose-800 border-rose-300/80' },
  };
  const cfg = map[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-300' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  if (priority === 'URGENT') return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">Urgente</span>
  );
  return (
    <span className="text-[11px] text-ink-disabled font-medium">{priority === 'LOW' ? 'Baja' : 'Normal'}</span>
  );
};

export const AdminDashboard = () => {
  const [orders,  setOrders]  = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selDriver, setSelDriver] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [optimizing, setOptimizing] = useState(false);
  const [optMsg, setOptMsg] = useState('');
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
      if (dRes.success) {
        setDrivers(dRes.drivers || []);
        if (!selDriver && dRes.drivers.length) setSelDriver(dRes.drivers[0].id);
      }
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
    }
    return () => { if (socket) { socket.off('order:created'); socket.off('order:updated'); socket.off('route:generated'); } };
  }, [socket]);

  const toggleSim = async () => {
    const r = await api.post('/routes/simulator/toggle', { action: simRunning ? 'stop' : 'start' });
    if (r.success) setSimRunning(r.simulator.isRunning);
  };

  const handleOptimize = async () => {
    if (!selDriver) return;
    setOptimizing(true); setOptMsg('');
    try {
      const r = await api.post('/routes/optimize', { driver_id: selDriver });
      if (r.success) { setActiveRoute(r.route); setOptMsg(`Ruta óptima: ${r.summary.totalDistanceKm} km · ~${r.summary.estimatedDurationMinutes} min`); loadAll(); }
    } catch (e) { setOptMsg(`Error: ${e.message}`); }
    finally { setOptimizing(false); }
  };

  const metrics = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'PENDING').length,
    transit:   orders.filter(o => o.status === 'IN_TRANSIT').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  const filtered = orders.filter(o => filterStatus === 'ALL' || o.status === filterStatus);

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-6 space-y-6">

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
        <StatCard label="Total órdenes"  value={metrics.total}     icon={Package}     color="text-slate-900" bgColor="bg-slate-100" />
        <StatCard label="Pendientes"     value={metrics.pending}   icon={Clock}       color="text-amber-700" bgColor="bg-amber-50" />
        <StatCard label="En tránsito"    value={metrics.transit}   icon={Truck}       color="text-indigo-700" bgColor="bg-indigo-50" />
        <StatCard label="Entregadas"     value={metrics.delivered} icon={CheckCircle2} color="text-emerald-700" bgColor="bg-emerald-50" />
      </div>

      {/* Map + Route optimizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mapa de Flota en Tiempo Real</span>
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
              {drivers.length} Vehículos en radar
            </span>
          </div>
          <LiveFleetMap orders={orders} drivers={drivers} activeRoute={activeRoute} center={[4.6534, -74.0836]} zoom={13} />
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Route optimizer card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Zap className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Optimizador de Ruta (2-opt)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Calcula la secuencia más corta para reducir distancias y consumo.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Conductor Asignado</label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                value={selDriver}
                onChange={e => setSelDriver(e.target.value)}
              >
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} · {d.vehicle_type}</option>)}
              </select>
            </div>

            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition shadow-xs"
            >
              <Zap className="w-4 h-4" strokeWidth={2} />
              <span>{optimizing ? 'Optimizando con 2-opt…' : 'Calcular Ruta Óptima'}</span>
            </button>

            {optMsg && (
              <div className="text-xs text-blue-800 bg-blue-50/80 border border-blue-200 rounded-xl p-3">
                {optMsg}
              </div>
            )}
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
                  <td className="px-6 py-4"><PriorityBadge priority={o.priority} /></td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700 hidden sm:table-cell">{o.driver_name || <span className="text-slate-400 italic">Sin asignar</span>}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
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
