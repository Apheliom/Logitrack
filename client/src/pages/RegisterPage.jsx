import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-ink-secondary">{label}</label>
    {children}
  </div>
);

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-disabled" strokeWidth={1.75} />}
    <input
      {...props}
      className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border border-surface-3 rounded-xl text-sm text-ink-primary placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition`}
    />
  </div>
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-4 py-2.5 bg-white border border-surface-3 rounded-xl text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
  >
    {children}
  </select>
);

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '',
    role: 'CLIENT', phone: '',
    vehicle_type: 'MOTORCYCLE', license_plate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(formData);
      if (user.role === 'ADMIN')  navigate('/admin');
      else if (user.role === 'DRIVER') navigate('/driver');
      else navigate('/track/TRK-2026-001');
    } catch (err) {
      setError(err.message || 'Error durante el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-ink-primary tracking-tight">LogiTrack</span>
        </div>

        <div className="bg-white border border-surface-3 rounded-2xl shadow-card p-7 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-ink-primary tracking-tight">Crear cuenta</h1>
            <p className="text-sm text-ink-tertiary mt-1">Completa los datos para registrarte en la plataforma.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre completo *">
              <Input icon={User} type="text" required placeholder="Ej. Roberto Sánchez" value={formData.full_name} onChange={e => set('full_name', e.target.value)} />
            </Field>

            <Field label="Correo electrónico *">
              <Input icon={Mail} type="email" required placeholder="correo@empresa.com" value={formData.email} onChange={e => set('email', e.target.value)} />
            </Field>

            <Field label="Contraseña *">
              <Input icon={Lock} type="password" required placeholder="Mínimo 6 caracteres" value={formData.password} onChange={e => set('password', e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Rol *">
                <Select value={formData.role} onChange={e => set('role', e.target.value)}>
                  <option value="CLIENT">Cliente</option>
                  <option value="DRIVER">Repartidor</option>
                  <option value="ADMIN">Administrador</option>
                </Select>
              </Field>
              <Field label="Teléfono">
                <Input icon={Phone} type="text" placeholder="+57 300..." value={formData.phone} onChange={e => set('phone', e.target.value)} />
              </Field>
            </div>

            {formData.role === 'DRIVER' && (
              <div className="p-4 bg-surface-1 border border-surface-3 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-ink-secondary">Datos del vehículo</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo">
                    <Select value={formData.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                      <option value="MOTORCYCLE">Motocicleta</option>
                      <option value="VAN">Furgoneta</option>
                      <option value="BICYCLE">Bicicleta</option>
                      <option value="CAR">Automóvil</option>
                    </Select>
                  </Field>
                  <Field label="Placa">
                    <Input type="text" placeholder="ABC-123" value={formData.license_plate} onChange={e => set('license_plate', e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
            >
              <span>{loading ? 'Registrando...' : 'Crear cuenta'}</span>
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
            </button>
          </form>

          <p className="text-center text-xs text-ink-tertiary">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">Iniciar sesión</Link>
          </p>
        </div>

      </div>
    </div>
  );
};
