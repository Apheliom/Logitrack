import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MetricCard } from '../components/UI/MetricCard';
import { Badge } from '../components/UI/Badge';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Package,
  ShieldCheck,
  FileText,
  RotateCw,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/analytics/overview');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('[AdminAnalyticsPage Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const metrics = data?.metrics || {
    totalOrders: 0,
    deliveredCount: 0,
    transitCount: 0,
    pendingCount: 0,
    totalRevenue: 0.0,
    avgDeliveryTimeMinutes: 0.0,
    onTimeRatePercentage: 0.0
  };

  const topProducts = data?.topProducts || [];
  const auditLogs = data?.auditLogs || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
            Módulo de Inteligencia Operativa
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Estadísticas Globales y Bitácora del Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de ventas, rendimiento de flota y registro forense inmutable de auditoría.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos Tienda"
          value={`$${metrics.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          variant="emerald"
          subtitle="Volumen de ventas directas"
        />
        <MetricCard
          title="Tasa a Tiempo"
          value={`${metrics.onTimeRatePercentage}%`}
          icon={CheckCircle2}
          variant="default"
          subtitle="SLA de entrega cumplido"
        />
        <MetricCard
          title="Tiempo Medio"
          value={`${metrics.avgDeliveryTimeMinutes}m`}
          icon={Clock}
          variant="sky"
          subtitle="Despacho a recepción"
        />
        <MetricCard
          title="Total Paquetes"
          value={metrics.totalOrders}
          icon={Package}
          variant="amber"
          subtitle={`${metrics.deliveredCount} Entregas completadas`}
        />
      </div>

      {/* Top Products Ranking */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Ranking de Productos Más Vendidos</h2>
              <p className="text-xs text-slate-500">Volumen de demanda acumulado en la tienda express</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">Actualizado en vivo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-5 py-3.5">Categoría</th>
                <th className="px-5 py-3.5">Unidades Vendidas</th>
                <th className="px-5 py-3.5 text-right">Ingresos Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No se registran ventas ni productos despachados aún en la base de datos.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-400">0{idx + 1}</td>
                    <td className="px-5 py-4 font-bold text-slate-900 text-sm">{p.name}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-800 text-sm">
                      {p.units} uds.
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-emerald-600 text-sm">
                      ${p.revenue.toFixed(2)} USD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bitácora de Auditoría Forense (Audit Logs) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden space-y-0">
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Bitácora Oficial de Auditoría (Audit Log)</h2>
              <p className="text-xs text-slate-500">Historial inmutable de eventos, cambios de estado y operadores</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 self-start sm:self-auto">
            {auditLogs.length} Registros Registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Fecha y Hora</th>
                <th className="px-6 py-3.5">Guía / Orden</th>
                <th className="px-6 py-3.5">Operador Responsable</th>
                <th className="px-6 py-3.5">Transición de Estado</th>
                <th className="px-6 py-3.5">Observaciones Técnicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No se registran eventos en la bitácora aún.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">
                      {log.tracking_number || log.order_id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{log.user_name || 'Sistema Automático'}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{log.user_role || 'CORE'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <span className="text-slate-400 line-through">{log.previous_status || 'NUEVO'}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {log.new_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs max-w-xs truncate">
                      {log.notes || 'Actualización de registro.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
