import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Truck, LogOut, Radio, Package, Navigation, LayoutDashboard } from 'lucide-react';

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
          ? 'bg-brand-50 text-brand-600'
          : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-2'
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );

  return (
    <header className="bg-white border-b border-surface-3 sticky top-0 z-50 h-14">
      <div className="max-w-screen-xl mx-auto px-5 h-full flex items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-ink-primary tracking-tight">LogiTrack</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {user.role === 'ADMIN' && (
            <NavLink to="/admin" icon={LayoutDashboard} label="Centro de Despacho" />
          )}
          {(user.role === 'ADMIN' || user.role === 'DRIVER') && (
            <NavLink to="/driver" icon={Navigation} label="Vista Repartidor" />
          )}
          <NavLink to="/track/TRK-2026-001" icon={Package} label="Rastreo" />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Telemetry dot */}
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${
              isConnected ? 'text-status-success' : 'text-status-danger'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-status-success animate-pulse' : 'bg-status-danger'}`} />
            <span>{isConnected ? 'En vivo' : 'Offline'}</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-surface-3" />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-ink-primary leading-tight truncate max-w-[130px]">
                {user.full_name}
              </div>
              <div className="text-[11px] text-ink-tertiary">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-ink-tertiary hover:text-status-danger hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
