import React from 'react';
import { FileSearch, Mic, Database, ServerCog, BookOpen } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';

export default function MobileBottomNav() {
  const { activeTab, setActiveTab, setGuideModalOpen } = useForensic();

  const navItems = [
    { id: 'file-analysis', label: 'Archivos', icon: FileSearch },
    { id: 'audio-analysis', label: 'Voz / IA', icon: Mic },
    { id: 'audit-logs', label: 'Custodia', icon: Database },
    { id: 'implementation-specs', label: 'Sistema', icon: ServerCog },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-obsidian-950/95 backdrop-blur-2xl border-t border-white/[0.1] px-2 py-1.5 flex items-center justify-around shadow-2xl safe-bottom select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 ${
              isActive
                ? 'text-cyan-400 font-bold bg-cyan-950/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              )}
            </div>
            <span className="text-[10px] font-mono tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Botón rápido de Manual Operativo */}
      <button
        onClick={() => setGuideModalOpen(true)}
        className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center space-y-1 text-zinc-400 hover:text-cyan-300 transition-all active:scale-95"
      >
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <span className="text-[10px] font-mono tracking-tight">Manual</span>
      </button>
    </nav>
  );
}
