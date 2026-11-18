import React, { useState } from 'react';
import { Layers, Copy, Check } from 'lucide-react';

/**
 * Tarjeta de Cadena de Custodia Criptográfica (FIPS 180-4)
 * Diseñado con las pautas de accesibilidad y foco de Vercel Web Design Guidelines
 */
export function CustodyHashCard({ sha256, pHash, evidenceId, magicSignature, detectedFormat }) {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedP, setCopiedP] = useState(false);

  const copyToClipboard = (text, isP = false) => {
    navigator.clipboard.writeText(text);
    if (isP) {
      setCopiedP(true);
      setTimeout(() => setCopiedP(false), 2000);
    } else {
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  return (
    <div className="p-5 rounded-3xl glass-panel space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>SELLADO DE CUSTODIA (SHA-256 & PERCEPTUAL HASH)</span>
        </span>
        <span className="text-[11px] font-mono text-zinc-400">
          ID: <strong className="text-white">{evidenceId || 'EVD-LOCAL-LIVE'}</strong>
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs">
        {/* SHA-256 */}
        <div className="p-2.5 rounded-2xl bg-obsidian-950/80 border border-white/[0.08] flex items-center justify-between hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800/40 font-bold shrink-0">
              SHA-256
            </span>
            <span className="text-zinc-300 truncate select-all">{sha256}</span>
          </div>
          <button
            onClick={() => copyToClipboard(sha256)}
            aria-label="Copiar Hash SHA-256"
            className="ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all shrink-0"
            title="Copiar Hash SHA-256"
          >
            {copiedSha ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* pHash Visual */}
        {pHash && (
          <div className="p-2.5 rounded-2xl bg-obsidian-950/80 border border-white/[0.08] flex items-center justify-between hover:border-purple-500/30 transition-colors">
            <div className="flex items-center space-x-2 truncate">
              <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/40 font-bold shrink-0">
                pHash (Visual)
              </span>
              <span className="text-zinc-300 truncate select-all">{pHash}</span>
            </div>
            <button
              onClick={() => copyToClipboard(pHash, true)}
              aria-label="Copiar pHash Visual"
              className="ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-zinc-800/60 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none transition-all shrink-0"
              title="Copiar pHash"
            >
              {copiedP ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Magic Bytes & Format Verification */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="p-2.5 rounded-2xl bg-obsidian-950/60 border border-white/[0.06]">
            <span className="text-zinc-500 block text-[10px]">MAGIC BYTES:</span>
            <span className="text-zinc-200 font-bold">{magicSignature || 'FF D8 FF'}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-obsidian-950/60 border border-white/[0.06]">
            <span className="text-zinc-500 block text-[10px]">FORMATO CONTENEDOR:</span>
            <span className="text-cyan-400 font-bold">{detectedFormat || 'JPEG'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
