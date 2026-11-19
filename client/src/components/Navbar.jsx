import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Truck, LogOut, Radio, Package, Navigation, UserCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-emerald-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-wide">LogiTrack</span>
            <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 border-l border-slate-700 pl-2">
              Sistemas 7mo
            </span>
          </div>
        </div>

        {/* Navigation Links based on Role */}
        <nav className="flex items-center gap-2">
          {user.role === 'ADMIN' && (
            <>
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive('/admin')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Despacho y Mapa</span>
              </Link>
            </>
          )}

          {(user.role === 'ADMIN' || user.role === 'DRIVER') && (
            <Link
              to="/driver"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/driver')
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Vista Repartidor</span>
            </Link>
          )}

          <Link
            to="/track/TRK-2026-001"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              location.pathname.startsWith('/track')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Tracking Demo</span>
          </Link>
        </nav>

        {/* Right side: Telemetry Status + User Info + Logout */}
        <div className="flex items-center gap-3">
          {/* Socket Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
            }`}
            title={isConnected ? 'Conectado a telemetría WebSockets' : 'Desconectado'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{isConnected ? 'GPS En Vivo' : 'Offline'}</span>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800 text-left">
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                {user.full_name}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
