import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Mail, Lock, ArrowRight, Zap } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (e, demoEmail, demoPass) => {
    if (e) e.preventDefault();
    const resolvedEmail = demoEmail || email;
    const resolvedPass  = demoPass  || password;
    setError('');
    setLoading(true);
    try {
      const user = await login(resolvedEmail, resolvedPass);
      if (user.role === 'ADMIN')  navigate('/admin');
      else if (user.role === 'DRIVER') navigate('/driver');
      else navigate('/track/TRK-2026-001');
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => doLogin(null, demoEmail, demoPass);

  return (
    <div className="min-h-screen bg-surface-1 flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-brand-600 p-10 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Truck className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-lg tracking-tight">LogiTrack</span>
        </div>

        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            Monitoreo de flota en tiempo real
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Gestión logística<br />sin fricciones.
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Optimiza rutas de reparto, monitorea vehículos con GPS en vivo y confirma entregas con firma digital.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Tiempo medio de entrega', value: '28 min' },
            { label: 'Paradas optimizadas/día', value: '340+' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
              <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-ink-primary">LogiTrack</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-ink-primary tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-ink-tertiary mt-1">Ingresa tus credenciales para continuar.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={doLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-secondary">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-disabled" strokeWidth={1.75} />
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-3 rounded-xl text-sm text-ink-primary placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-secondary">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-disabled" strokeWidth={1.75} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-3 rounded-xl text-sm text-ink-primary placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
            >
              <span>{loading ? 'Validando...' : 'Entrar al sistema'}</span>
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
            </button>
          </form>

          {/* Quick access */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-3" />
              <span className="text-xs text-ink-disabled font-medium">Acceso rápido (demo)</span>
              <div className="flex-1 h-px bg-surface-3" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@logitrack.com', 'Password123!')}
                disabled={loading}
                className="p-3 bg-white border border-surface-3 hover:border-brand-300 hover:bg-brand-50 rounded-xl text-left transition-all group disabled:opacity-60"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-brand-500" strokeWidth={2} />
                  <span className="text-xs font-semibold text-brand-600">Despachador</span>
                </div>
                <div className="text-[11px] text-ink-tertiary leading-tight">admin@logitrack.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('driver1@logitrack.com', 'Password123!')}
                disabled={loading}
                className="p-3 bg-white border border-surface-3 hover:border-green-300 hover:bg-green-50 rounded-xl text-left transition-all disabled:opacity-60"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-status-success" strokeWidth={2} />
                  <span className="text-xs font-semibold text-status-success">Repartidor 01</span>
                </div>
                <div className="text-[11px] text-ink-tertiary leading-tight">driver1@logitrack.com</div>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-ink-tertiary">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Crear cuenta nueva
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};
