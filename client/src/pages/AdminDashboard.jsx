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

const StatCard = ({ label, value, icon: Icon, color = 'text-ink-primary' }) => (
  <div className="bg-white border border-surface-3 rounded-2xl p-5 shadow-card">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium text-ink-tertiary">{label}</span>
      <div className="p-1.5 rounded-lg bg-surface-2">
        <Icon className="w-3.5 h-3.5 text-ink-tertiary" strokeWidth={1.75} />
      </div>
    </div>
    <div className={`text-2xl font-bold tabular-nums tracking-tight ${color}`}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:    { label: 'Pendiente',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
    ASSIGNED:   { label: 'Asignado',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
    IN_TRANSIT: { label: 'En tránsito',  className: 'bg-violet-50 text-violet-700 border-violet-200' },
    DELIVERED:  { label: 'Entregado',    className: 'bg-green-50 text-green-700 border-green-200' },
    FAILED:     { label: 'Fallido',      className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const cfg = map[status] || { label: status, className: 'bg-surface-2 text-ink-tertiary border-surface-3' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.className}`}>
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
        <StatCard label="Total órdenes"  value={metrics.total}     icon={Package}     />
        <StatCard label="Pendientes"     value={metrics.pending}   icon={Clock}       color="text-amber-600" />
        <StatCard label="En tránsito"    value={metrics.transit}   icon={Truck}       color="text-violet-600" />
        <StatCard label="Entregadas"     value={metrics.delivered} icon={CheckCircle2} color="text-status-success" />
      </div>

      {/* Map + Route optimizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Map */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              Mapa de flota en tiempo real
            </h2>
            <span className="text-xs text-ink-tertiary">{drivers.length} vehículos monitoreados</span>
          </div>
          <LiveFleetMap orders={orders} drivers={drivers} activeRoute={activeRoute} center={[4.6534, -74.0836]} zoom={13} />
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Route optimizer card */}
          <div className="bg-white border border-surface-3 rounded-2xl p-5 shadow-card space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Zap className="w-4 h-4 text-brand-600" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-ink-primary">Optimizador de ruta</h3>
              </div>
              <p className="text-xs text-ink-tertiary">Algoritmo 2-opt heurístico sobre distancias de Haversine.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-secondary">Conductor</label>
              <select
                className="w-full px-3 py-2 bg-surface-1 border border-surface-3 rounded-xl text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                value={selDriver} onChange={e => setSelDriver(e.target.value)}
              >
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} · {d.vehicle_type}</option>)}
              </select>
            </div>

            <button onClick={handleOptimize} disabled={optimizing}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" strokeWidth={2} />
              {optimizing ? 'Calculando…' : 'Calcular ruta óptima'}
            </button>

            {optMsg && <p className="text-xs text-ink-secondary bg-surface-1 border border-surface-3 rounded-xl px-3 py-2">{optMsg}</p>}
          </div>

          {/* Drivers status */}
          <div className="bg-white border border-surface-3 rounded-2xl p-5 shadow-card">
            <h3 className="text-sm font-semibold text-ink-primary mb-3">Estado de repartidores</h3>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {drivers.map(d => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-1 border border-surface-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-primary truncate">{d.full_name}</div>
                    <div className="text-xs text-ink-tertiary">{d.vehicle_type} · {d.license_plate}</div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.status === 'ON_DELIVERY' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {d.status === 'ON_DELIVERY' ? 'En ruta' : 'Libre'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-surface-3 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
            <Package className="w-4 h-4 text-ink-tertiary" strokeWidth={1.75} />
            Órdenes de entrega
          </h3>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-surface-1 border border-surface-3 p-0.5 rounded-xl text-xs">
            {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${filterStatus === s ? 'bg-white shadow-sm text-ink-primary' : 'text-ink-tertiary hover:text-ink-primary'}`}
              >
                {s === 'ALL' ? 'Todos' : s === 'IN_TRANSIT' ? 'En tránsito' : s === 'DELIVERED' ? 'Entregados' : 'Pendientes'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-1 border-b border-surface-3 text-xs font-semibold text-ink-tertiary uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Tracking</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3 hidden md:table-cell">Dirección</th>
                <th className="px-5 py-3">Prioridad</th>
                <th className="px-5 py-3 hidden sm:table-cell">Repartidor</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Rastreo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-ink-disabled">No hay órdenes para este filtro.</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-surface-1 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-brand-600">{o.tracking_number}</td>
                  <td className="px-5 py-3.5 font-medium text-ink-primary">{o.client_name}</td>
                  <td className="px-5 py-3.5 text-ink-tertiary text-xs hidden md:table-cell max-w-[200px] truncate">{o.delivery_address}</td>
                  <td className="px-5 py-3.5"><PriorityBadge priority={o.priority} /></td>
                  <td className="px-5 py-3.5 text-sm text-ink-secondary hidden sm:table-cell">{o.driver_name || <span className="text-ink-disabled">—</span>}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <a href={`/track/${o.tracking_number}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Ver <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
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
