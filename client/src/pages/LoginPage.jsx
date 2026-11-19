import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/track/TRK-2026-001');
      }
    } catch (err) {
      setError(err.message || 'Error en las credenciales.');
    } finally {
      setLoading(false);
    }
  };

  // Acceso rápido con 1 solo clic: rellena y entra de inmediato
  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(demoEmail, demoPass);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin');
      } else if (loggedUser.role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/track/TRK-2026-001');
      }
    } catch (err) {
      setError(err.message || 'Error en las credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/50">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">LogiTrack Portal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Implantación de Sistemas - Gestión y Telemetría en Vivo
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="usuario@logitrack.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>{loading ? 'Validando...' : 'Entrar al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              ⚡ Acceso rápido para defensa académica (Cuentas de prueba):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@logitrack.com', 'Password123!')}
                className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-200 text-left transition hover:border-emerald-500/50"
              >
                <div className="font-bold text-emerald-400">Despachador</div>
                <div className="text-[10px] text-slate-400">admin@logitrack.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('driver1@logitrack.com', 'Password123!')}
                className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-200 text-left transition hover:border-emerald-500/50"
              >
                <div className="font-bold text-indigo-400">Repartidor 01</div>
                <div className="text-[10px] text-slate-400">driver1@logitrack.com</div>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            ¿No tienes cuenta aún?{' '}
            <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
              Crear cuenta nueva
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
