import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

/**
 * Patrón "patterns-explicit-variants" de Vercel Composition Patterns
 * Variante declarativa para dictámenes periciales
 */
export function VerdictBadge({ verdict, riskScore, showDetails = true }) {
  const isHighRisk = riskScore >= 60 || verdict?.includes('MANIPULADO') || verdict?.includes('DEEPFAKE');
  const isSuspicious = !isHighRisk && (riskScore >= 30 || verdict?.includes('SOSPECHOSO') || verdict?.includes('ANOMALIAS'));
  
  if (isHighRisk) {
    return (
      <div 
        role="alert" 
        className="p-6 rounded-3xl border border-rose-500/50 bg-rose-950/40 text-rose-200 glow-rose-ambient flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-rose-900/60 text-rose-300 border border-rose-700/50 shrink-0 shadow-lg">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 font-bold border border-rose-800/40 text-rose-300">
              DICTAMEN PERICIAL OFICIAL
            </span>
            <h3 className="text-base font-extrabold mt-1.5 tracking-tight text-white">
              ALERTA: Archivo Potencialmente Alterado / Generado por IA
            </h3>
            {showDetails && (
              <p className="text-xs text-rose-200/90 mt-1 max-w-md">
                Se identificaron trazas explícitas de generación por IA (Gemini/Imagen/DALL-E), software de edición o supresión deliberada de procedencia óptica.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-black/50 border border-rose-500/30 shrink-0 min-w-[110px] shadow-inner">
          <span className="text-[10px] font-mono text-zinc-400">ÍNDICE DE RIESGO</span>
          <span className="text-2xl font-black font-mono text-rose-400">
            {riskScore}%
          </span>
          <span className="text-[9px] font-mono mt-0.5 uppercase tracking-wide text-rose-300 font-bold">
            CRÍTICO
          </span>
        </div>
      </div>
    );
  }

  if (isSuspicious) {
    return (
      <div 
        role="alert" 
        className="p-6 rounded-3xl border border-amber-500/50 bg-amber-950/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-amber-900/60 text-amber-300 border border-amber-700/50 shrink-0 shadow-lg">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 font-bold border border-amber-800/40 text-amber-300">
              DICTAMEN PERICIAL OFICIAL
            </span>
            <h3 className="text-base font-extrabold mt-1.5 tracking-tight text-white">
              ADVERTENCIA: Evidencia con Inconsistencias Estructurales
            </h3>
            {showDetails && (
              <p className="text-xs text-amber-200/90 mt-1 max-w-md">
                Discrepancias temporales o metadatos de sensor omitidos requieren peritaje de laboratorio adicional.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 shrink-0 min-w-[110px] shadow-inner">
          <span className="text-[10px] font-mono text-zinc-400">ÍNDICE DE RIESGO</span>
          <span className="text-2xl font-black font-mono text-amber-400">
            {riskScore}%
          </span>
          <span className="text-[9px] font-mono mt-0.5 uppercase tracking-wide text-amber-300 font-bold">
            ELEVADO
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      role="status" 
      className="p-6 rounded-3xl border border-emerald-500/50 bg-emerald-950/40 text-emerald-200 glow-emerald-ambient flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
    >
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-2xl bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 shrink-0 shadow-lg">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 font-bold border border-emerald-800/40 text-emerald-300">
            DICTAMEN PERICIAL OFICIAL
          </span>
          <h3 className="text-base font-extrabold mt-1.5 tracking-tight text-white">
            VERIFICADO: Archivo Original / Sin Huellas de Manipulación
          </h3>
          {showDetails && (
            <p className="text-xs text-emerald-200/90 mt-1 max-w-md">
              La estructura binaria, tablas de cuantización DQT y parámetros EXIF coinciden con una captura óptica directa no adulterada.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-black/50 border border-emerald-500/30 shrink-0 min-w-[110px] shadow-inner">
        <span className="text-[10px] font-mono text-zinc-400">ÍNDICE DE RIESGO</span>
        <span className="text-2xl font-black font-mono text-emerald-400">
          {riskScore}%
        </span>
        <span className="text-[9px] font-mono mt-0.5 uppercase tracking-wide text-emerald-300 font-bold">
          ÍNTEGRO
        </span>
      </div>
    </div>
  );
}
