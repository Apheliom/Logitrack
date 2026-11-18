import React from 'react';
import { FileSearch, Mic, Database, ServerCog, Cpu, ShieldAlert, Sparkles } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useForensic();

  const menuItems = [
    {
      id: 'file-analysis',
      label: 'Módulo A: Procedencia & EXIF',
      subtext: 'Gemini, C2PA, ELA & Hash SHA-256',
      icon: FileSearch,
      tag: 'IMAGEN / DOC',
      badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40'
    },
    {
      id: 'audio-analysis',
      label: 'Módulo B: Biometría & Audio',
      subtext: 'Web Audio en Vivo & Deepfakes',
      icon: Mic,
      tag: 'VOZ 60 FPS',
      badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/40'
    },
    {
      id: 'audit-logs',
      label: 'Módulo C: Cadena de Custodia',
      subtext: 'Ledger Forense & Certificación',
      icon: Database,
      tag: 'TRAZABILIDAD',
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40'
    },
    {
      id: 'implementation-specs',
      label: 'Puesta en Marcha & Specs',
      subtext: 'Ficha de Implantación de Sistemas',
      icon: ServerCog,
      tag: 'ACADÉMICO',
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40'
    }
  ];

  return (
    <aside className="w-80 border-r border-white/[0.08] bg-obsidian-950/60 backdrop-blur-xl flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold px-2 flex items-center space-x-1.5">
            <span>MÓDULOS DE ANÁLISIS FORENSE</span>
          </span>
          <nav className="mt-2.5 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all duration-200 border flex flex-col relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/50 via-obsidian-850 to-obsidian-900 border-cyan-500/40 shadow-lg shadow-cyan-950/40'
                      : 'bg-zinc-900/30 hover:bg-zinc-900/70 border-white/[0.04] hover:border-white/[0.08] text-zinc-400'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r shadow-[0_0_10px_#22d3ee]" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'bg-zinc-800/60 text-zinc-400 group-hover:text-zinc-200'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pl-8 text-zinc-400">
                    <span className="truncate pr-2">{item.subtext}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                      isActive ? item.badgeColor : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400'
                    }`}>
                      {item.tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live System Diagnostics Box (v0 Style) */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] font-mono text-[11px] space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>SUBSISTEMA CRIPTO</span>
            </span>
            <span className="text-emerald-400 font-bold tracking-wider">FIPS 180-4</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 w-3/4 rounded-full shadow-[0_0_8px_#22d3ee] animate-pulse" />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/[0.04]">
            <span>Buffer: In-Memory RAM</span>
            <span className="text-cyan-300 font-medium">Zero-Disk Leakage</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/[0.06] bg-obsidian-950/80 text-[11px] font-mono text-zinc-500">
        <div className="flex justify-between items-center mb-1">
          <span>Despliegue:</span>
          <span className="text-zinc-300 font-semibold">Producción Enterprise</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Infraestructura: SecuriTrace Core v2.4
        </div>
      </div>
    </aside>
  );
}
