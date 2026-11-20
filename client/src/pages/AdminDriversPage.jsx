import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Truck, User, Phone, Star, CheckCircle2, Clock,
  Edit3, MessageSquare, AlertCircle, RotateCw, X,
  Shield, Check, ArrowRight, Mail, Key
} from 'lucide-react';
import { MetricCard } from '../components/UI/MetricCard';
import { Badge } from '../components/UI/Badge';

export const AdminDriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDriver, setEditingDriver] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Formulario de edición
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    vehicle_type: 'MOTORCYCLE',
    license_plate: '',
    status: 'IDLE',
    is_available: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drivers/admin/overview');
      if (res.success) {
        setDrivers(res.drivers || []);
        setReviews(res.reviews || []);
      }
    } catch (err) {
      console.error('[AdminDriversPage Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      full_name: driver.full_name || '',
      email: driver.email || '',
      password: '',
      phone: driver.phone || '',
      vehicle_type: driver.vehicle_type || 'MOTORCYCLE',
      license_plate: driver.license_plate || '',
      status: driver.status || 'IDLE',
      is_available: driver.is_available !== false
    });
    setSaveMsg(null);
  };

  const closeEditModal = () => {
    setEditingDriver(null);
    setSaveMsg(null);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!editingDriver) return;
    try {
      setSaving(true);
      setSaveMsg(null);
      const res = await api.put(`/drivers/${editingDriver.id}/profile`, formData);
      if (res.success) {
        setSaveMsg({ type: 'success', text: 'Datos del conductor actualizados exitosamente.' });
        await loadData();
        setTimeout(() => {
          closeEditModal();
        }, 1200);
      } else {
        setSaveMsg({ type: 'error', text: res.message || 'Error al guardar cambios.' });
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Fallo de conexión al actualizar.' });
    } finally {
      setSaving(false);
    }
  };

  // Métricas consolidadas de la flota
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.is_available).length;
  const inRouteDrivers = drivers.filter(d => d.status === 'ON_DELIVERY').length;
  const totalDelivered = drivers.reduce((acc, d) => acc + (d.delivered_orders_count || 0), 0);
  const fleetAvgRating = drivers.length > 0
    ? (drivers.reduce((acc, d) => acc + Number(d.avg_rating || 0), 0) / drivers.filter(d => Number(d.avg_rating) > 0).length || 0).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
            Módulo de Supervisión de Flota
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Gestión y Rendimiento de Conductores
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de perfiles vehiculares, asignación operativa y auditoría de reseñas de clientes.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Flota</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Conductores"
          value={totalDrivers}
          icon={User}
          variant="blue"
          subtitle={`${activeDrivers} con disponibilidad activa`}
        />
        <MetricCard
          title="En Ruta Ahora"
          value={inRouteDrivers}
          icon={Truck}
          variant="indigo"
          subtitle="Despachos en tránsito"
        />
        <MetricCard
          title="Entregas Exitosas"
          value={totalDelivered}
          icon={CheckCircle2}
          variant="emerald"
          subtitle="Historial acumulado de flota"
        />
        <MetricCard
          title="Calificación Promedio"
          value={Number(fleetAvgRating) > 0 ? `${fleetAvgRating} / 5` : 'N/A'}
          icon={Star}
          variant="amber"
          subtitle={`${reviews.length} reseñas registradas`}
        />
      </div>

      {/* Lista de Conductores */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Listado Maestro de Choferes Registrados</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">{drivers.length} registros</span>
        </div>

        {drivers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se han registrado conductores en la base de datos aún.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/60 transition-colors"
              >
                {/* Info Principal */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                    {driver.full_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900">{driver.full_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        driver.status === 'ON_DELIVERY'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : (driver.status === 'IDLE' || driver.status === 'AVAILABLE' || driver.is_available)
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {driver.status === 'ON_DELIVERY' ? 'En ruta' : (driver.status === 'IDLE' || driver.status === 'AVAILABLE' || driver.is_available) ? 'Disponible' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5 font-medium">
                      <span>{driver.email}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {driver.phone || 'Sin teléfono'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                        {driver.vehicle_type === 'MOTORCYCLE' ? 'Motocicleta' : driver.vehicle_type === 'VAN' ? 'Furgoneta' : driver.vehicle_type === 'TRUCK' ? 'Camión' : driver.vehicle_type === 'BICYCLE' ? 'Bicicleta' : driver.vehicle_type} ({driver.license_plate || 'Sin placa'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas y Acciones */}
                <div className="flex flex-wrap items-center gap-6 lg:justify-end">
                  {/* Rating */}
                  <div className="text-center px-4 py-2 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                    <div className="flex items-center justify-center gap-1 text-amber-700 font-bold text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{Number(driver.avg_rating) > 0 ? Number(driver.avg_rating).toFixed(1) : 'Nuevo'}</span>
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                      {driver.total_reviews_count || 0} valoraciones
                    </div>
                  </div>

                  {/* Órdenes */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-slate-900 text-sm font-mono">{driver.active_orders_count || 0}</div>
                      <div className="text-[10px] text-slate-500">Activas</div>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <div className="font-bold text-emerald-600 text-sm font-mono">{driver.delivered_orders_count || 0}</div>
                      <div className="text-[10px] text-slate-500">Completadas</div>
                    </div>
                  </div>

                  {/* Botón Editar */}
                  <button
                    onClick={() => openEditModal(driver)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Modificar Datos</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reseñas y Feedback de Clientes */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Auditoría de Reseñas y Satisfacción de Clientes</h2>
              <p className="text-xs text-slate-500">Feedback verificado tras confirmación de entrega en tiempo real</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
            {reviews.length} Evaluaciones
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se han enviado reseñas de clientes aún. Cuando los clientes califiquen sus pedidos, aparecerán aquí automáticamente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (rev.client_rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {rev.recipient_name || 'Cliente'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      → Asignado a: <strong className="text-slate-700">{rev.driver_name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span className="font-bold text-blue-600">{rev.tracking_number}</span>
                    <span>•</span>
                    <span>{new Date(rev.updated_at || rev.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {rev.client_feedback && (
                  <p className="mt-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-sans">
                    "{rev.client_feedback}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Modificación de Datos de Conductor */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeEditModal}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Modificar Datos de Conductor</h3>
                <p className="text-xs text-slate-500">Actualizar credenciales de acceso, vehículo y estado operativo</p>
              </div>
            </div>

            {saveMsg && (
              <div className={`p-3.5 mb-5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                saveMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {saveMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{saveMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveDriver} className="space-y-4">
              {/* Sección 1: Credenciales de Login */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Credenciales de Acceso
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="conductor@logitrack.com"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Conservar actual (en blanco)"
                        minLength={6}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 2: Información Personal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+58 412 1234567"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sección 3: Vehículo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Vehículo</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MOTORCYCLE">Motocicleta</option>
                    <option value="VAN">Furgoneta / Van</option>
                    <option value="TRUCK">Camión de Carga</option>
                    <option value="BICYCLE">Bicicleta Express</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Placa / Matrícula</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                    placeholder="AA1B23C"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  />
                </div>
              </div>

              {/* Sección 4: Turno y Disponibilidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Estado de Turno</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="IDLE">Disponible / En Espera</option>
                    <option value="ON_DELIVERY">En Entrega / En Ruta</option>
                    <option value="OFFLINE">Fuera de Turno</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Disponibilidad</label>
                  <select
                    value={formData.is_available ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.value === '1' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">Habilitado para Despacho</option>
                    <option value="0">Deshabilitado Temporalmente</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
