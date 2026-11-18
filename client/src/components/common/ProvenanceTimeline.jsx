import React from 'react';
import { GitCommit, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Componente de Visualización Genealógica de Procedencia (Digital Provenance)
 * Diseñado bajo el patrón de grafo cronológico de Vercel Composition Patterns
 */
export function ProvenanceTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="p-5 rounded-3xl glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <h4 className="text-xs font-mono font-semibold text-cyan-400 flex items-center space-x-1.5">
          <GitCommit className="w-4 h-4" />
          <span>LÍNEA DE TIEMPO DE PROCEDENCIA VIRTUAL (DIGITAL PROVENANCE)</span>
        </h4>
        <span className="text-[10px] font-mono text-zinc-500">
          {timeline.length} {timeline.length === 1 ? 'EVENTO' : 'EVENTOS'} REGISTRADOS
        </span>
      </div>

      <div className="relative border-l-2 border-cyan-800/40 ml-3.5 pl-5 space-y-4 font-mono text-xs">
        {timeline.map((item, index) => {
          const isOrigin = index === 0;
          const isLatest = index === timeline.length - 1;

          return (
            <div key={index} className="relative group">
              {/* Glowing Node Marker */}
              <div 
                className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-obsidian-950 transition-all ${
                  isLatest 
                    ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] ring-2 ring-cyan-500/30' 
                    : isOrigin 
                    ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' 
                    : 'bg-zinc-500'
                }`} 
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                <span className={`font-bold tracking-tight ${isLatest ? 'text-cyan-300' : isOrigin ? 'text-purple-300' : 'text-zinc-200'}`}>
                  {item.stage}
                </span>
                <span className="text-zinc-500 text-[10px] flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span>{item.timestamp}</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 font-semibold mt-0.5">{item.actor}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed bg-obsidian-950/60 p-2 rounded-xl border border-white/[0.04]">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
