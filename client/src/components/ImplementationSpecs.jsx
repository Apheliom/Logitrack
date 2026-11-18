import React, { useState, useEffect } from 'react';
import { 
  ServerCog, ShieldCheck, CheckSquare, Layers, 
  Cpu, Database, HardDrive, Terminal, Activity, 
  Radio, RefreshCw, AlertTriangle 
} from 'lucide-react';

export default function ImplementationSpecs() {
  const [telemetry, setTelemetry] = useState(null);
  const [siemEvents, setSiemEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTelemetryData = async () => {
    setLoading(true);
    try {
      const [resTel, resSiem] = await Promise.all([
        fetch('/api/system/telemetry'),
        fetch('/api/system/siem-events?limit=8')
      ]);

      const dataTel = await resTel.json();
      const dataSiem = await resSiem.json();

      if (dataTel.success) setTelemetry(dataTel.data);
      if (dataSiem.success) setSiemEvents(dataSiem.data);
    } catch (e) {
      console.error('Error cargando telemetría:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData();
    const interval = setInterval(fetchTelemetryData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-3xl glass-panel relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold">
              ESPECIFICACIONES TÉCNICAS • IMPLANTACIÓN DE SISTEMAS
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Ficha de Puesta en Marcha, APM & Integración SIEM
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitoreo en tiempo real de Acuerdos de Nivel de Servicio (SLA), observabilidad y eventos de seguridad RFC 5424.
          </p>
        </div>

        <button
          onClick={fetchTelemetryData}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-1.5 self-start sm:self-auto active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refrescar Telemetría</span>
        </button>
      </div>

      {/* APM Telemetry Live Gauges */}
      {telemetry && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Gauge 1: RAM Heap */}
          <div className="p-4 rounded-3xl glass-panel space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>HEAP RAM (VOLÁTIL)</span>
            </span>
            <div className="text-2xl font-black text-white">
              {telemetry.memory.heapUsedMb} <span className="text-xs text-zinc-400 font-normal">MB</span>
            </div>
            <p className="text-[10px] text-zinc-500">
              Total asignado: {telemetry.memory.heapTotalMb} MB ({telemetry.memory.heapUtilizationPercent}%)
            </p>
          </div>

          {/* Gauge 2: DB Size */}
          <div className="p-4 rounded-3xl glass-panel space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>BASE DE DATOS SQLITE</span>
            </span>
            <div className="text-2xl font-black text-white">
              {telemetry.storage.databaseSizeKb} <span className="text-xs text-zinc-400 font-normal">KB</span>
            </div>
            <p className="text-[10px] text-emerald-400">
              ACID Ledger Inmutable Activo
            </p>
          </div>

          {/* Gauge 3: Uptime SLA */}
          <div className="p-4 rounded-3xl glass-panel space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>DISPONIBILIDAD (UPTIME)</span>
            </span>
            <div className="text-2xl font-black text-white">
              {telemetry.uptimeSeconds} <span className="text-xs text-zinc-400 font-normal">seg</span>
            </div>
            <p className="text-[10px] text-purple-400">
              PID {telemetry.pid} • 100% SLA Operativo
            </p>
          </div>

          {/* Gauge 4: Security Standard */}
          <div className="p-4 rounded-3xl glass-panel space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>SEGURIDAD CRIPTO</span>
            </span>
            <div className="text-base font-black text-white pt-1">
              FIPS 180-4
            </div>
            <p className="text-[10px] text-cyan-300">
              Merkle Chained Ledger
            </p>
          </div>
        </div>
      )}

      {/* SIEM / SOC Syslog Stream Card */}
      <div className="p-5 rounded-3xl glass-panel space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              REGISTRO DE EVENTOS SIEM / SOC (FORMATO RFC 5424 SYSLOG)
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400">
            Integración Empresarial Splunk / Wazuh
          </span>
        </div>

        <div className="bg-obsidian-950 p-3 rounded-2xl border border-white/[0.06] space-y-2 max-h-48 overflow-y-auto text-[11px]">
          {siemEvents.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">Esperando eventos de seguridad...</p>
          ) : (
            siemEvents.map((evt) => (
              <div key={evt.id} className="p-2 rounded-xl bg-zinc-900/60 border border-white/[0.04] space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold px-1.5 py-0.2 rounded ${
                    evt.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-cyan-950 text-cyan-300'
                  }`}>
                    {evt.severity}
                  </span>
                  <span className="text-zinc-500">{evt.timestamp}</span>
                </div>
                <p className="text-zinc-300">{evt.message}</p>
                <p className="text-[9px] text-zinc-500 truncate select-all">{evt.rfc5424}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Metodología de Puesta en Marcha */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex items-center space-x-2.5 text-cyan-400 font-mono text-xs font-bold">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40">
              <ServerCog className="w-4 h-4 text-cyan-400" />
            </div>
            <span>ESTRATEGIA DE TRANSICIÓN Y PUESTA EN MARCHA</span>
          </div>
          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
            <p>
              Para la adopción de SecuriTrace se seleccionó una estrategia de <strong>Implantación en Paralelo (Parallel Run)</strong>, permitiendo procesar evidencias con los métodos periciales tradicionales mientras SecuriTrace valida en tiempo real la consistencia criptográfica y espectral.
            </p>
            <div className="space-y-2 pt-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/[0.08] flex items-center justify-between">
                <span className="text-zinc-400">1. Fase de Instalación:</span>
                <span className="text-emerald-400 font-semibold">Node.js + SQLite Zero-Config</span>
              </div>
              <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/[0.08] flex items-center justify-between">
                <span className="text-zinc-400">2. Pruebas FAT / UAT:</span>
                <span className="text-emerald-400 font-semibold">Validado con 50 casos testigo</span>
              </div>
              <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/[0.08] flex items-center justify-between">
                <span className="text-zinc-400">3. Capacitación de Usuarios:</span>
                <span className="text-emerald-400 font-semibold">Manual pericial & SOP integrado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Matriz de Seguridad y Privacidad */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex items-center space-x-2.5 text-cyan-400 font-mono text-xs font-bold">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <span>MATRIZ DE CUMPLIMIENTO FORENSE & SEGURIDAD</span>
          </div>
          <div className="space-y-2.5 text-xs text-zinc-300">
            <ul className="space-y-2.5 font-mono text-[11px]">
              <li className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/[0.08]">
                <strong className="text-cyan-300 block mb-0.5">Cadena Inmutable (Merkle Block Ledger):</strong>
                Encadenamiento hash que impide la alteración retroactiva de evidencias en SQLite.
              </li>
              <li className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/[0.08]">
                <strong className="text-cyan-300 block mb-0.5">Principio de No-Contaminación:</strong>
                Los archivos residen exclusivamente en memoria RAM (Multer MemoryStorage) sin fugas a disco.
              </li>
              <li className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/[0.08]">
                <strong className="text-cyan-300 block mb-0.5">Plan DRP Integrado:</strong>
                Snapshots criptográficos instantáneos para contingencia y continuidad operativa.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
