import React, { useState } from 'react';
import { Bot, Sparkles, ShieldAlert, ShieldCheck, Copy, Check, Key, ExternalLink, FileText, AlertCircle, Eye } from 'lucide-react';

export default function AiForensicReportCard({ aiPericial, onReanalyzeWithKey }) {
  const [copied, setCopied] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState(localStorage.getItem('securitrace_gemini_key') || '');
  const [expandedReport, setExpandedReport] = useState(false);

  const saveKey = () => {
    if (inputKey.trim()) {
      localStorage.setItem('securitrace_gemini_key', inputKey.trim());
    } else {
      localStorage.removeItem('securitrace_gemini_key');
    }
    setShowKeyModal(false);
    if (onReanalyzeWithKey) {
      onReanalyzeWithKey();
    }
  };

  const copyReportText = () => {
    if (!aiPericial?.data?.informe_pericial_markdown) return;
    navigator.clipboard.writeText(aiPericial.data.informe_pericial_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Si requiere clave de API
  if (!aiPericial || aiPericial.status === 'REQUIRES_API_KEY') {
    return (
      <div className="p-5 rounded-3xl glass-panel border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-obsidian-950 to-indigo-950/40 space-y-3 font-mono shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-900/60 border border-cyan-500/40 text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>DICTAMEN PERICIAL MULTIMODAL CON IA</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/80 text-cyan-300 border border-cyan-400/40 font-bold">
                  GEMINI VISION
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Inspección semántica de anomalías, comprobantes de pago móvil y capturas de IA
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-500/20"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configurar API Key Gratuita</span>
          </button>
        </div>

        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
          Para realizar el análisis semántico de alta precisión (discriminar pagos móviles originales de falsos, o capturas de pantalla de imágenes creadas con IA), configure una clave gratuita de <strong>Google Gemini</strong>. Se obtiene en menos de 1 minuto sin costo en Google AI Studio.
        </p>

        {showKeyModal && (
          <div className="mt-3 p-4 rounded-2xl bg-obsidian-950/90 border border-cyan-500/40 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-cyan-300 font-bold">Clave de API de Google Gemini:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline flex items-center space-x-1 text-[11px]"
              >
                <span>Obtener clave gratis en Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex space-x-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={saveKey}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs rounded-xl transition-all"
              >
                Guardar y Activar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si falló la inferencia de IA
  if (aiPericial.status === 'ERROR') {
    return (
      <div className="p-4 rounded-3xl glass-panel border border-rose-500/40 bg-rose-950/20 font-mono text-xs space-y-2">
        <div className="flex items-center space-x-2 text-rose-400 font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>Error en el Análisis Multimodal de IA</span>
        </div>
        <p className="text-zinc-300">{aiPericial.error || aiPericial.message}</p>
        <button
          onClick={() => setShowKeyModal(true)}
          className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1 mt-1"
        >
          <Key className="w-3 h-3" />
          <span>Cambiar o actualizar API Key</span>
        </button>
      </div>
    );
  }

  // Si fue exitoso
  const data = aiPericial.data || {};
  const isSafe = data.riesgo_porcentaje <= 15.0;
  const isFraud = data.riesgo_porcentaje >= 75.0;

  return (
    <div className="p-5 rounded-3xl glass-panel border border-cyan-500/40 bg-gradient-to-br from-obsidian-950 via-cyan-950/20 to-indigo-950/30 space-y-4 font-mono shadow-2xl relative overflow-hidden animate-fadeIn">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2.5 rounded-2xl border ${isSafe ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : isFraud ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' : 'bg-amber-950/80 border-amber-500/50 text-amber-300'}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                DICTAMEN PERICIAL JUDICIAL (IA MULTIMODAL)
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                GEMINI 1.5 FLASH VISION
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Auditoría óptica, tipográfica y de coherencia semántica en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowKeyModal(true)}
            title="Ajustar API Key"
            className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/10 transition-all text-[11px] flex items-center space-x-1"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clave IA</span>
          </button>
          <button
            onClick={copyReportText}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Dictamen'}</span>
          </button>
        </div>
      </div>

      {/* Modal para cambiar la clave si lo desea */}
      {showKeyModal && (
        <div className="p-4 rounded-2xl bg-black/90 border border-cyan-500/50 space-y-2 animate-fadeIn">
          <div className="flex justify-between items-center text-xs">
            <span className="text-cyan-300 font-bold">Configurar Clave Google Gemini (Gratuita):</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center space-x-1 text-[11px]"
            >
              <span>Obtener Gratis</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex space-x-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="flex-1 bg-obsidian-950 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={saveKey}
              className="px-3 py-1.5 bg-cyan-500 text-obsidian-950 font-bold text-xs rounded-xl"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Tarjeta de Veredicto Principal de IA */}
      <div className={`p-4 rounded-2xl border ${isSafe ? 'bg-emerald-950/30 border-emerald-500/40' : isFraud ? 'bg-rose-950/30 border-rose-500/40' : 'bg-amber-950/30 border-amber-500/40'} flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              Veredicto Pericial Categórico:
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${isSafe ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-400/50' : isFraud ? 'bg-rose-900/80 text-rose-200 border border-rose-400/50' : 'bg-amber-900/80 text-amber-200 border border-amber-400/50'}`}>
              {data.veredicto || 'INSPECCION_COMPLETADA'}
            </span>
          </div>
          <p className="text-xs text-zinc-200 font-sans leading-relaxed">
            {data.dictamen_ejecutivo}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/10 text-center min-w-[90px]">
            <span className="text-[10px] text-zinc-400 block">Riesgo IA:</span>
            <span className={`text-base font-black ${isSafe ? 'text-emerald-400' : isFraud ? 'text-rose-400' : 'text-amber-400'}`}>
              {(data.riesgo_porcentaje || 0).toFixed(1)}%
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/10 text-center min-w-[90px]">
            <span className="text-[10px] text-zinc-400 block">Certeza:</span>
            <span className="text-base font-black text-cyan-300">
              {(data.confianza_pericial || 98.0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid de 4 Ejes de Auditoría Semántica */}
      {data.elementos_analizados && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06] space-y-1">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Coherencia Óptica e Iluminación:</span>
            </span>
            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              {data.elementos_analizados.coherencia_optica_iluminacion}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06] space-y-1">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anatomía / Geometría de Interfaz:</span>
            </span>
            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              {data.elementos_analizados.coherencia_anatomica_estructural}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06] space-y-1">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Tipografía y Fuentes Numéricas:</span>
            </span>
            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              {data.elementos_analizados.tipografia_y_textos}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06] space-y-1">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Artefactos de Difusión / Inpainting:</span>
            </span>
            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              {data.elementos_analizados.artefactos_de_difusion_o_edicion}
            </p>
          </div>
        </div>
      )}

      {/* Anomalías Específicas Detectadas por la IA */}
      {data.anomalias_detectadas && data.anomalias_detectadas.length > 0 && (
        <div className="space-y-1.5 p-3 rounded-2xl bg-obsidian-950/90 border border-white/[0.06]">
          <span className="text-[10px] text-zinc-400 font-bold block">
            HALLAZGOS FORENSES REGISTRADOS POR EL MODELO:
          </span>
          <ul className="space-y-1 list-disc list-inside text-zinc-300 text-xs font-sans">
            {data.anomalias_detectadas.map((anom, idx) => (
              <li key={idx} className="leading-relaxed text-zinc-200">
                {anom}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botón y Sección Desplegable para Ver el Informe Pericial Formal */}
      {data.informe_pericial_markdown && (
        <div className="pt-2 border-t border-white/[0.08]">
          <button
            onClick={() => setExpandedReport(!expandedReport)}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-cyan-300 text-xs font-bold flex items-center justify-between transition-all"
          >
            <span className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>{expandedReport ? 'Ocultar Dictamen Pericial Completo' : 'Ver Dictamen Pericial Judicial Completo (Markdown / Acta)'}</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {expandedReport ? '▲ Colapsar' : '▼ Expandir Acta Pericial'}
            </span>
          </button>

          {expandedReport && (
            <div className="mt-3 p-5 rounded-2xl bg-black/80 border border-cyan-500/30 text-xs font-sans text-zinc-200 leading-relaxed space-y-3 whitespace-pre-wrap select-text animate-fadeIn">
              <div className="flex justify-end pb-2 border-b border-white/10">
                <button
                  onClick={copyReportText}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Acta Completa</span>
                </button>
              </div>
              {data.informe_pericial_markdown}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
