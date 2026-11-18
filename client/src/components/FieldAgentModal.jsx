import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, Wifi, Globe, Copy, Check, Radio, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';

export default function FieldAgentModal({ isOpen, onClose }) {
  const { setFileAnalysisResult, notifyEvidenceSaved } = useForensic();

  const [sessionToken] = useState(() => `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [lanIp, setLanIp] = useState('192.168.1.102');
  const [hostMode, setHostMode] = useState('lan'); // 'lan', 'custom'
  const [customHost, setCustomHost] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const [lastReceived, setLastReceived] = useState(null);

  // 1. Obtener interfaces de red locales desde el backend
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/system/network-info')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.primaryIp) {
          setNetworkInfo(json.data);
          setLanIp(json.data.primaryIp);
        }
      })
      .catch(err => console.warn('Network info unavailable:', err));
  }, [isOpen]);

  // 2. Calcular URL de destino local directo
  const resolvedBaseUrl = React.useMemo(() => {
    if (hostMode === 'custom' && customHost.trim()) {
      return customHost.trim().replace(/\/$/, '');
    }

    const ip = lanIp.trim() || '192.168.1.102';
    return `http://${ip}:5173`;
  }, [hostMode, customHost, lanIp]);

  const fieldAgentUrl = `${resolvedBaseUrl}/?mode=field-agent&session=${sessionToken}`;

  // 3. Generar Código QR nítido
  useEffect(() => {
    if (!isOpen || !fieldAgentUrl) return;

    QRCode.toDataURL(fieldAgentUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#030712',
        light: '#06b6d4'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR Gen error:', err));
  }, [isOpen, fieldAgentUrl]);

  // 4. Polling en vivo para detectar fotos transmitidas desde el móvil
  useEffect(() => {
    if (!isOpen || !isListening) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/forensics/live-poll?sessionToken=${sessionToken}`);
        const json = await res.json();

        if (json.success && json.hasNewEvidence && json.data) {
          const evidence = json.data;
          setLastReceived(evidence);
          setFileAnalysisResult(evidence);
          notifyEvidenceSaved?.(evidence);

          // Al recibir la evidencia, podemos reproducir un aviso
          console.log('[FIELD AGENT] Nueva evidencia recibida en tiempo real:', evidence);
        }
      } catch (e) {
        // Silencioso en poll
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen, isListening, sessionToken, setFileAnalysisResult, notifyEvidenceSaved]);

  const copyUrl = () => {
    navigator.clipboard.writeText(fieldAgentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel p-6 rounded-3xl border border-cyan-500/40 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Field Agent Real-Time Mode</span>
              </span>
              <span className="text-xs font-mono text-zinc-500">Módulo Distribuido de Campo</span>
            </div>
            <h3 className="text-base font-bold font-mono text-zinc-100 flex items-center space-x-2">
              <span>VINCULACIÓN POR QR (TERMINAL MÓVIL DE CAMPO)</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de evidencia recibida */}
        {lastReceived && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 flex items-center justify-between text-xs font-mono animate-pulse">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-emerald-200 font-bold block">¡EVIDENCIA CAPTURADA EN TIEMPO REAL!</span>
                <span className="text-zinc-400 text-[11px]">
                  {lastReceived.filename} transmitido por {lastReceived.operator}.
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Ver Análisis en Pantalla
            </button>
          </div>
        )}

        {/* Contenido Principal: QR + Selector de Host */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Columna QR */}
          <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-obsidian-950/90 border border-cyan-500/30 shadow-inner space-y-3">
            {qrDataUrl ? (
              <div className="p-3 bg-cyan-500 rounded-2xl shadow-xl">
                <img src={qrDataUrl} alt="Field Agent QR" className="w-56 h-56 rounded-lg object-contain" />
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            )}
            <span className="text-[10px] font-mono text-zinc-400 text-center block">
              Escanea con cualquier celular (iOS o Android) para disparar la cámara y el GPS.
            </span>
          </div>

          {/* Columna Opciones de Host & Red */}
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-zinc-300 block">
                MODO DE CONEXIÓN DEL AGENTE MÓVIL:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={() => setHostMode('lan')}
                  className={`p-2.5 rounded-xl border transition-all text-center flex items-center justify-center space-x-2 ${
                    hostMode === 'lan'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold shadow-lg shadow-cyan-950/50'
                      : 'bg-obsidian-900/60 border-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span>Red Local LAN (Wi-Fi)</span>
                </button>

                <button
                  onClick={() => setHostMode('custom')}
                  className={`p-2.5 rounded-xl border transition-all text-center flex items-center justify-center space-x-2 ${
                    hostMode === 'custom'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold shadow-lg shadow-cyan-950/50'
                      : 'bg-obsidian-900/60 border-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Personalizado / Cloud</span>
                </button>
              </div>
            </div>

            {/* Input de IP Local */}
            {hostMode === 'lan' && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 font-mono">
                <label className="text-[10px] text-cyan-300 font-bold flex items-center justify-between">
                  <span>DIRECCIÓN IP DE TU PC EN LA RED:</span>
                  <span className="text-zinc-400 font-normal">Puerto: 5173</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={lanIp}
                    onChange={(e) => setLanIp(e.target.value)}
                    className="w-full bg-obsidian-950 border border-white/[0.15] rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-200 font-bold focus:outline-none focus:border-cyan-400"
                    placeholder="192.168.1.102"
                  />
                  <span className="text-xs text-zinc-400 font-bold">:5173</span>
                </div>
                <span className="text-[10px] text-zinc-400 block pt-0.5">
                  El QR se actualiza en vivo al cambiar los dígitos de la IP.
                </span>
              </div>
            )}

            {/* Input custom si aplica */}
            {hostMode === 'custom' && (
              <div className="space-y-1 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                <label className="text-[10px] font-mono text-amber-300 font-bold block">
                  URL PÚBLICA (DOMINIO O HOSTING):
                </label>
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  placeholder="https://tudominio.com"
                  className="w-full bg-obsidian-950 border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Caja de Enlace con Botón Copiar */}
            <div className="p-3 rounded-2xl bg-obsidian-950/80 border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>ENLACE DIRECTO RESOLVIDO:</span>
                <span className="text-emerald-400">Escucha Activa</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={fieldAgentUrl}
                  className="w-full bg-obsidian-900 text-[11px] font-mono text-cyan-300 px-2.5 py-1.5 rounded-lg border border-white/[0.06] select-all truncate"
                />
                <button
                  onClick={copyUrl}
                  className="p-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 transition-colors"
                  title="Copiar URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-zinc-300 font-semibold">Canal de Escucha Ininterrumpido</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Al transmitir cualquier evidencia desde el dispositivo móvil, la consola central actualizará de inmediato el dictamen pericial forense y la trazabilidad de procedencia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
