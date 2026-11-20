import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogiTrackLogo } from '../components/Brand/LogiTrackLogo';
import { Mail, Lock, ArrowRight, Zap, Shield, Navigation, UserCheck } from 'lucide-react';

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
    const resolvedPass = demoPass || password;
    setError('');
    setLoading(true);
    try {
      const user = await login(resolvedEmail, resolvedPass);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/store');
      }
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => doLogin(null, demoEmail, demoPass);

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block">
          <LogiTrackLogo size="lg" variant="full" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Control de Despacho & Telemetría
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Plataforma web de logística para implantación de sistemas
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200/90 rounded-3xl shadow-sm space-y-6">

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={doLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@logitrack.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-xs"
            >
              <span>{loading ? 'Validando credenciales...' : 'Iniciar Sesión'}</span>
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Acceso Rápido por Rol (Demostración)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@logitrack.com', 'Password123!')}
                disabled={loading}
                className="p-3 bg-blue-50/70 border border-blue-200 hover:bg-blue-100/70 rounded-2xl text-left transition disabled:opacity-50 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-blue-900">Admin</span>
                </div>
                <span className="text-[10px] text-blue-600 block leading-tight">Despacho</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('driver1@logitrack.com', 'Password123!')}
                disabled={loading}
                className="p-3 bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100/70 rounded-2xl text-left transition disabled:opacity-50 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-900">Repartidor</span>
                </div>
                <span className="text-[10px] text-emerald-600 block leading-tight">Ruta GPS</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cliente@logitrack.com', 'Password123!')}
                disabled={loading}
                className="p-3 bg-purple-50/70 border border-purple-200 hover:bg-purple-100/70 rounded-2xl text-left transition disabled:opacity-50 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="text-xs font-bold text-purple-900">Cliente</span>
                </div>
                <span className="text-[10px] text-purple-600 block leading-tight">Tienda</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500">
            ¿Deseas una nueva cuenta?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Crear cuenta de cliente
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

