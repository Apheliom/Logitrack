import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogiTrackLogo } from './Brand/LogiTrackLogo';
import { LogOut, Radio, Package, Navigation, LayoutDashboard, ShoppingBag, BarChart3, ClipboardList } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isActive(to)
          ? 'bg-blue-50 text-blue-700 shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 h-16 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">

        {/* Brand Logo */}
        <Link
          to={user.role === 'ADMIN' ? '/admin' : user.role === 'DRIVER' ? '/driver' : '/store'}
          className="hover:opacity-95 transition-opacity"
        >
          <LogiTrackLogo size="md" variant="full" />
        </Link>

        {/* Navigation segregada estrictamente por rol */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 p-1 border border-slate-200/80 rounded-xl">
          {/* Vistas solo para ADMIN */}
          {user.role === 'ADMIN' && (
            <>
              <NavLink to="/admin" icon={LayoutDashboard} label="Panel & Mapa" />
              <NavLink to="/admin/drivers" icon={Truck} label="Conductores" />
              <NavLink to="/admin/analytics" icon={BarChart3} label="Estadísticas & Bitácora" />
            </>
          )}

          {/* Vistas solo para DRIVER */}
          {user.role === 'DRIVER' && (
            <NavLink to="/driver" icon={Navigation} label="Terminal de Rutas" />
          )}

          {/* Vistas solo para CLIENTE */}
          {user.role === 'CLIENT' && (
            <>
              <NavLink to="/store" icon={ShoppingBag} label="Catálogo Express" />
              <NavLink to="/client/my-orders" icon={ClipboardList} label="Mis Compras" />
            </>
          )}
        </nav>

        {/* Right side status and profile */}
        <div className="flex items-center gap-3">
          {/* Real-time Telemetry Pill */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                : 'bg-rose-50 text-rose-700 border-rose-200/70'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline">{isConnected ? 'Telemetría Activa' : 'Offline'}</span>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* User profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {user.role === 'ADMIN' ? 'Despacho Central' : user.role === 'DRIVER' ? 'Operador de Ruta' : 'Cliente'}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
