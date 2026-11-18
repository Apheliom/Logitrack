import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Printer, Search, RefreshCw, 
  Trash2, ShieldAlert, ShieldCheck, FileText, ExternalLink,
  Filter, CheckCircle, Clock, User, Sparkles, CheckCircle2,
  HardDrive, AlertTriangle, Shield, Radio, Key
} from 'lucide-react';

export default function AuditDashboard({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  // Estados de funciones de Implantación de Sistemas
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainReport, setChainReport] = useState(null);
  const [backingUp, setBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Error obteniendo logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  // Función 1: Verificación de Cadena Inmutable Merkle Ledger
  const handleVerifyMerkleChain = async () => {
    setVerifyingChain(true);
    setChainReport(null);
    try {
      const res = await fetch('/api/audit/verify-chain');
      const data = await res.json();
      if (data.success) {
        setChainReport(data.data);
      }
    } catch (err) {
      alert('Error verificando integridad de la cadena: ' + err.message);
    } finally {
      setVerifyingChain(false);
    }
  };

  // Función 2: Creación de Respaldo DRP (Disaster Recovery Plan)
  const handleCreateDRPBackup = async () => {
    setBackingUp(true);
    setBackupResult(null);
    try {
      const res = await fetch('/api/audit/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackupResult(data.data);
      }
    } catch (err) {
      alert('Error generando respaldo DRP: ' + err.message);
    } finally {
      setBackingUp(false);
    }
  };

  const handleExportJSON = () => {
    window.location.href = '/api/audit/export';
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleClearLogs = async () => {
    if (window.confirm('¿Deseas purgar la cadena de custodia para iniciar una sesión de prueba en limpio?')) {
      try {
        const res = await fetch('/api/audit/clear', { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchLogs();
          setChainReport(null);
        }
      } catch (e) {
        alert('Error purgando logs: ' + e.message);
      }
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.evidence_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.file_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.operator || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterVerdict === 'ALL') return matchesSearch;
    if (filterVerdict === 'MANIPULATED') return matchesSearch && (log.risk_score >= 60 || log.verdict.includes('MANIPULADO') || log.verdict.includes('DEEPFAKE'));
    if (filterVerdict === 'AUTHENTIC') return matchesSearch && (log.risk_score < 30 || log.verdict.includes('AUTENTICO') || log.verdict.includes('NATURAL'));
    if (filterVerdict === 'SUSPICIOUS') return matchesSearch && (log.risk_score >= 30 && log.risk_score < 60);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl glass-panel relative overflow-hidden no-print">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-bold">
              MÓDULO C • CADENA DE CUSTODIA & INMUTABILIDAD MERKLE
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Panel de Auditoría, Ledger Inmutable & DRP
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registro pericial inmutable con encadenamiento criptográfico (`prev_hash` → `block_hash`) y respaldos DRP.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {/* Botón de Respaldo DRP */}
          <button
            onClick={handleCreateDRPBackup}
            disabled={backingUp}
            className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 font-mono text-xs font-semibold flex items-center space-x-1.5 active:scale-95 transition-all shadow-sm"
            title="Crear copia instantánea DRP firmada con SHA-256"
          >
            <HardDrive className={`w-3.5 h-3.5 text-purple-400 ${backingUp ? 'animate-bounce' : ''}`} />
            <span>Snapshot DRP</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-semibold flex items-center space-x-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-zinc-200 font-mono text-xs font-semibold flex items-center space-x-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] active:scale-95 transition-all shadow-sm"
            title="Refrescar Registros"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 active:scale-95 transition-all shadow-sm"
            title="Resetear Cadena de Custodia"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DRP Snapshot Result Banner */}
      {backupResult && (
        <div className="p-4 rounded-3xl border border-purple-500/40 bg-purple-950/40 text-purple-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-purple-900/70 text-purple-300">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-900 text-purple-200 font-bold border border-purple-400/40">
                PLAN DE CONTINGENCIA (DRP) EJECUTADO
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                Snapshot Criptográfico de Base de Datos Generado con Éxito
              </h4>
              <p className="text-xs opacity-90 mt-0.5 font-mono text-zinc-300">
                Archivo: {backupResult.filename} • SHA-256: <code className="text-purple-300 select-all">{backupResult.sha256.slice(0, 24)}...</code>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={`/api/audit/backups/download/${backupResult.filename}`}
              download
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .db</span>
            </a>
            <button 
              onClick={() => setBackupResult(null)}
              className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-black/40"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel font-mono text-xs no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por ID, archivo o hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-obsidian-950/80 border border-white/[0.08] rounded-xl pl-10 pr-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-xs"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-zinc-500 text-[11px] mr-1 hidden md:inline">FILTRO:</span>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'MANIPULATED', label: 'Críticos (Rojo)' },
            { id: 'SUSPICIOUS', label: 'Sospechosos' },
            { id: 'AUTHENTIC', label: 'Verificados (Verde)' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterVerdict(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap ${
                filterVerdict === f.id
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl border border-white/[0.08] glass-panel overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-obsidian-950/90 border-b border-white/[0.08] text-zinc-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID Evidencia</th>
                <th className="py-3.5 px-4">Archivo / Muestra</th>
                <th className="py-3.5 px-4">Hash SHA-256 (Custodia)</th>
                <th className="py-3.5 px-4">Riesgo</th>
                <th className="py-3.5 px-4">Veredicto Oficial</th>
                <th className="py-3.5 px-4">Firma de Bloque (Merkle)</th>
                <th className="py-3.5 px-4">Operador</th>
                <th className="py-3.5 px-4 text-right no-print">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-zinc-500">
                    No se encontraron registros de auditoría coincidentes.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isHighRisk = log.risk_score >= 60 || log.verdict.includes('MANIPULADO') || log.verdict.includes('DEEPFAKE');
                  const isLowRisk = log.risk_score < 30 || log.verdict.includes('AUTENTICO') || log.verdict.includes('NATURAL');

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3.5 px-4 text-cyan-400 font-bold whitespace-nowrap">
                        {log.evidence_id}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-200 font-semibold max-w-[180px] truncate" title={log.filename}>
                        {log.filename}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[10px] select-all max-w-[150px] truncate" title={log.file_hash}>
                        {log.file_hash}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                          isHighRisk ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40' : isLowRisk ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                        }`}>
                          {log.risk_score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isHighRisk 
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50' 
                            : isLowRisk 
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                        }`}>
                          {isHighRisk ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          <span>{log.verdict}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-cyan-300 font-mono text-[10px] truncate max-w-[140px]" title={log.block_hash || log.prev_hash}>
                        {log.block_hash ? `${log.block_hash.slice(0, 16)}...` : 'Génesis'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                        {log.operator || 'Auditor'}
                      </td>
                      <td className="py-3.5 px-4 text-right no-print">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 group-hover:bg-cyan-950 group-hover:text-cyan-300 text-zinc-400 text-[11px] border border-white/[0.06] transition-colors"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Flyout for Detailed Peritaje View */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-obsidian-950 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-800/40 text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-base text-white">
                    EXPEDIENTE PERICIAL: {selectedLog.evidence_id}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">Cadena de Custodia con Firma Merkle</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-white font-mono text-xs px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 transition-colors"
              >
                Cerrar [ESC]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
                <span className="text-zinc-500 block text-[10px]">ARCHIVO EXAMINADO:</span>
                <span className="text-white font-bold">{selectedLog.filename}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
                <span className="text-zinc-500 block text-[10px]">TIPO DE SESIÓN:</span>
                <span className="text-cyan-400 font-bold">{selectedLog.session_type}</span>
              </div>
            </div>

            {/* Cryptographic Linkage Details */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-zinc-400">
                <span>HASH DEL BLOQUE (MERKLE SEAL):</span>
                <span className="text-cyan-300 font-bold">{selectedLog.block_hash ? 'Sellado Válido' : 'Génesis'}</span>
              </div>
              <p className="text-cyan-300 select-all break-all bg-obsidian-950 p-2.5 rounded-xl border border-white/[0.06] text-[11px]">
                {selectedLog.block_hash || '0000000000000000000000000000000000000000000000000000000000000000'}
              </p>
              <div className="text-[10px] text-zinc-500 flex justify-between">
                <span>Enlace a Bloque Previo (prev_hash):</span>
                <span className="truncate max-w-[240px] text-zinc-400">{selectedLog.prev_hash}</span>
              </div>
            </div>

            {/* Anomalies Box */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-bold text-zinc-300">
                HALLAZGOS Y ANOMALÍAS REGISTRADAS:
              </h4>
              {selectedLog.anomalies_detected && selectedLog.anomalies_detected.length > 0 ? (
                <ul className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs font-mono text-rose-200 space-y-1.5 list-disc list-inside">
                  {selectedLog.anomalies_detected.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-2xl">
                  No se registraron anomalías en la estructura binaria ni en los metadatos.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-between items-center text-xs font-mono text-zinc-500">
              <span>Perito: {selectedLog.operator}</span>
              <span>Registrado: {new Date(selectedLog.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
