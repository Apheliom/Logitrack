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

  // Coordenadas predefinidas para pruebas rápidas
  const setQuickCoords = (lat, lng, name) => {
    setFormData((prev) => ({
      ...prev,
      dest_lat: lat.toString(),
      dest_lng: lng.toString(),
      delivery_address: name
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <Plus className="w-5 h-5" />
            <span>Nueva Orden de Entrega</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Distribuidora Los Andes"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="+57 300 000 0000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dirección de Entrega *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Calle 85 # 14-20"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
            />
          </div>

          {/* Preset Coords */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Puntos de prueba rápidos:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setQuickCoords(4.6750, -74.0550, 'Parque de la 93')}
                className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
              >
                📍 Parque 93
              </button>
              <button
                type="button"
                onClick={() => setQuickCoords(4.6580, -74.0590, 'Zona Financiera Cll 72')}
                className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
              >
                📍 Calle 72
              </button>
              <button
                type="button"
                onClick={() => setQuickCoords(4.6460, -74.0630, 'Zona Chapinero')}
                className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
              >
                📍 Chapinero
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Latitud Destino *
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                value={formData.dest_lat}
                onChange={(e) => setFormData({ ...formData, dest_lat: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Longitud Destino *
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                value={formData.dest_lng}
                onChange={(e) => setFormData({ ...formData, dest_lng: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgente</option>
                <option value="LOW">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Asignar Repartidor
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
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
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-900/40 transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Orden'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
