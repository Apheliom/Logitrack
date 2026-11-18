import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, MapPin, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Send, Radio, FileText, PlusCircle } from 'lucide-react';

const OPERATIONAL_ZONES = [
  { name: 'Sector Operativo Central', lat: 10.4910, lon: -66.8983 },
  { name: 'Laboratorio de Informática Forense', lat: 10.4880, lon: -66.8730 },
  { name: 'Unidad Móvil de Intervención Alpha', lat: 10.4950, lon: -66.8520 },
  { name: 'Auditorio de Presentaciones', lat: 10.5050, lon: -66.9150 }
];

export default function FieldAgentView() {
  const [sessionToken, setSessionToken] = useState('DEFAULT_FIELD_SESSION');
  const [operator, setOperator] = useState('Agente_Campo_1');
  const [operationalZone, setOperationalZone] = useState('Sector Operativo Central');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('LOCALIZANDO SENSOR...');
  const [coords, setCoords] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Extraer sessionToken de la URL (?mode=field-agent&session=XYZ)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('session');
    if (token) {
      setSessionToken(token);
    }

    // Solicitar GPS en vivo de alta precisión
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null
          });
          setGpsStatus(`GPS SATELITAL ACTIVO • ±${Math.round(pos.coords.accuracy)}m`);
        },
        (err) => {
          console.warn('GPS sensor warning:', err);
          setGpsStatus('GPS NAVEGADOR RESTRINGIDO (Ubicación Operativa Declarada / EXIF)');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsStatus('USANDO METADATOS EXIF / UBICACIÓN DECLARADA');
    }
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setUploadSuccess(null);

    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const transmitEvidence = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionToken', sessionToken);
      formData.append('operator', operator);
      formData.append('operationalZone', operationalZone);

      if (coords) {
        formData.append('liveGps', JSON.stringify(coords));
      } else {
        const found = OPERATIONAL_ZONES.find(z => z.name === operationalZone) || OPERATIONAL_ZONES[0];
        formData.append('declaredGps', JSON.stringify({ latitude: found.lat, longitude: found.lon }));
      }

      const res = await fetch('/api/forensics/field-upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.includes('Cannot POST') ? 'Servidor requiere reinicio (ejecuta node start.js en consola)' : errText.slice(0, 90)}`);
      }

      const json = await res.json();
      if (json.success) {
        setUploadSuccess(json.data);
        setEvidenceCount(prev => prev + 1);
      } else {
        alert('Error en transmisión: ' + json.error);
      }
    } catch (err) {
      console.error('Error transmitiendo:', err);
      alert('Aviso de Transmisión: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForNextFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-zinc-100 p-4 flex flex-col justify-between max-w-md mx-auto font-sans">
      {/* Header Móvil */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-mono tracking-tight text-white">SECURITRACE</h1>
              <span className="text-[10px] font-mono text-cyan-400">TERMINAL DE CAMPO</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {evidenceCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                {evidenceCount} {evidenceCount === 1 ? 'ENVÍO' : 'ENVÍOS'}
              </span>
            )}
            <div className="px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>EN VIVO</span>
            </div>
          </div>
        </div>

        {/* Barra de Telemetría GPS / Ubicación */}
        <div className="p-3 rounded-2xl bg-obsidian-900/90 border border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-zinc-300 text-[11px] truncate max-w-[200px]">{gpsStatus}</span>
          </div>
          {coords ? (
            <span className="text-[10px] text-zinc-500">
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </span>
          ) : (
            <span className="text-[10px] text-amber-400">MODO LOCAL</span>
          )}
        </div>

        {/* Parámetros Operativos */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-2xl bg-obsidian-900/70 border border-white/[0.06] space-y-1">
            <label className="text-[9px] font-mono text-zinc-400 block uppercase">Operador / Agente:</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full bg-obsidian-950 border border-white/[0.1] rounded-xl px-2.5 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
              placeholder="Agente_01"
            />
          </div>

          <div className="p-2.5 rounded-2xl bg-obsidian-900/70 border border-white/[0.06] space-y-1">
            <label className="text-[9px] font-mono text-zinc-400 block uppercase">Zona Operativa:</label>
            <select
              value={operationalZone}
              onChange={(e) => setOperationalZone(e.target.value)}
              className="w-full bg-obsidian-950 border border-white/[0.1] rounded-xl px-2 py-1 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              {OPERATIONAL_ZONES.map(z => (
                <option key={z.name} value={z.name} className="bg-obsidian-950 text-zinc-200">
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pantalla de Éxito con soporte Multi-envío */}
      {uploadSuccess ? (
        <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4 my-auto">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 mx-auto flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-mono text-emerald-200">¡EVIDENCIA TRANSMITIDA!</h3>
            <p className="text-xs text-zinc-400">
              Proyectada en tiempo real en la consola central del Puesto de Mando.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-white/[0.06] text-left font-mono text-[10px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Expediente:</span>
              <span className="text-cyan-300 font-bold">{uploadSuccess.evidenceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Veredicto Forense:</span>
              <span className={uploadSuccess.riskScore >= 60 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {uploadSuccess.verdict} ({uploadSuccess.riskScore}%)
              </span>
            </div>
            <div className="pt-1 border-t border-white/[0.06]">
              <span className="text-zinc-500 block">Hash SHA-256:</span>
              <span className="text-zinc-300 break-all text-[9px]">{uploadSuccess.hashes?.sha256}</span>
            </div>
          </div>

          <button
            onClick={resetForNextFile}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>TRANSMITIR SIGUIENTE ARCHIVO (MISMA SESIÓN)</span>
          </button>
        </div>
      ) : (
        /* Selector de Cualquier Archivo / Cámara / Documento */
        <div className="my-auto space-y-4 py-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,application/pdf,application/*"
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/40 bg-obsidian-900 shadow-xl max-h-72 flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-72 object-contain" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-obsidian-950/90 border border-white/20 text-xs font-mono text-zinc-200 shadow-lg backdrop-blur-md"
              >
                Cambiar Archivo
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-3xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/10 active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold font-mono text-cyan-200 block">SELECCIONAR ARCHIVO O FOTO</span>
                <span className="text-xs text-zinc-400 block">
                  Cámara, Galería, Descargas (WhatsApp) o Documentos PDF
                </span>
              </div>
            </div>
          )}

          {file && (
            <div className="p-3.5 rounded-2xl bg-obsidian-900/80 border border-white/[0.06] text-xs font-mono flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate mr-2">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-zinc-300 truncate">{file.name}</span>
              </div>
              <span className="text-zinc-500 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          )}
        </div>
      )}

      {/* Botón de Transmisión Inferior */}
      {!uploadSuccess && (
        <div className="space-y-2 pb-2">
          <button
            onClick={transmitEvidence}
            disabled={!file || uploading}
            className={`w-full py-4 px-4 rounded-2xl font-mono text-xs font-bold tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xl ${
              file && !uploading
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/50 active:scale-[0.98]'
                : 'bg-zinc-800 text-zinc-500 border border-white/[0.04] cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>TRANSMITIENDO A PUESTO DE MANDO...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>TRANSMITIR AL PUESTO DE MANDO</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
            <span>Sesión: {sessionToken.slice(0, 16)}...</span>
            <span>SecuriTrace v2.4 Enterprise</span>
          </div>
        </div>
      )}
    </div>
  );
}
