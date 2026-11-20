import React, { useState } from 'react';
import { X, Plus, MapPin } from 'lucide-react';
import { api } from '../../api/client';

export const CreateOrderModal = ({ isOpen, onClose, onOrderCreated, drivers = [] }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    delivery_address: '',
    dest_lat: '4.6650',
    dest_lng: '-74.0580',
    priority: 'NORMAL',
    assigned_driver_id: '',
    delivery_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        dest_lat: parseFloat(formData.dest_lat),
        dest_lng: parseFloat(formData.dest_lng),
        assigned_driver_id: formData.assigned_driver_id || null
      };

      const res = await api.post('/orders', payload);
      if (res.success) {
        onOrderCreated(res.order);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error al crear la orden de entrega.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickCoords = (lat, lng, name) => {
    setFormData((prev) => ({
      ...prev,
      dest_lat: lat.toString(),
      dest_lng: lng.toString(),
      delivery_address: name
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Nueva Orden de Entrega</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ingresa los datos del destinatario y punto en el mapa</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Distribuidora Los Andes"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="+57 300 000 0000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dirección de Entrega *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Calle 85 # 14-20"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Puntos predefinidos de prueba:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuickCoords(4.6750, -74.0550, 'Parque de la 93')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg border border-slate-200 transition"
              >
                Parque de la 93
              </button>
              <button
                type="button"
                onClick={() => setQuickCoords(4.6580, -74.0590, 'Calle 72 # 11-45')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg border border-slate-200 transition"
              >
                Calle 72 Financiera
              </button>
              <button
                type="button"
                onClick={() => setQuickCoords(4.6460, -74.0630, 'Carrera 7 # 60-20')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg border border-slate-200 transition"
              >
                Chapinero Central
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Latitud Destino *
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono text-xs"
                value={formData.dest_lat}
                onChange={(e) => setFormData({ ...formData, dest_lat: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Longitud Destino *
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono text-xs"
                value={formData.dest_lng}
                onChange={(e) => setFormData({ ...formData, dest_lng: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Prioridad
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgente</option>
                <option value="LOW">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Asignar Repartidor
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                value={formData.assigned_driver_id}
                onChange={(e) => setFormData({ ...formData, assigned_driver_id: e.target.value })}
              >
                <option value="">-- Sin asignar --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.vehicle_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 rounded-xl transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Entrega'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
