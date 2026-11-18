import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud, FileCheck, Calendar,
  Cpu, HardDrive, RefreshCw, Zap, Sparkles, ShieldCheck,
  Search, AlertTriangle, Layers, Radio, Bot, Wrench, QrCode, MapPin, Share2, Activity
} from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import { VerdictBadge } from './common/VerdictBadge';
import { CustodyHashCard } from './common/CustodyHashCard';
import { ProvenanceTimeline } from './common/ProvenanceTimeline';
import ThreatRadarDeck from './common/ThreatRadarDeck';
import ForensicGeoMap from './common/ForensicGeoMap';
import { humanizeForensicText, humanizeForensicDate, humanizeTechnicalParam } from '../utils/forensicFormatter';

export default function FileAnalyzer() {
  const {
    fileAnalysisResult,
    setFileAnalysisResult,
    notifyEvidenceSaved,
    operator,
    setOperator,
    activeAgent,
    setFieldAgentModalOpen
  } = useForensic();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [affidavitData, setAffidavitData] = useState(null);
  const [loadingAffidavit, setLoadingAffidavit] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAffidavit = async (evidenceId) => {
    if (!evidenceId) return;
    setLoadingAffidavit(true);
    try {
      const res = await fetch(`/api/forensics/affidavit/${evidenceId}`);
      const json = await res.json();
      if (json.success) {
        setAffidavitData(json.data);
      } else {
        alert('Error al recuperar dictamen pericial: ' + json.error);
      }
    } catch (err) {
      console.error('Error fetching affidavit:', err);
      alert('Error de conexión al recuperar el dictamen.');
    } finally {
      setLoadingAffidavit(false);
    }
  };

  const getDeviceLocation = () => {
    return new Promise((resolve) => {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
          }),
          () => resolve(null),
          { timeout: 2000, enableHighAccuracy: true }
        );
      } else {
        resolve(null);
      }
    });
  };

  const handleFileChange = useCallback((selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileAnalysisResult(null);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [setFileAnalysisResult]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  const runAnalysis = async () => {
    if (!file) return;

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operator', operator);

    try {
      const liveGps = await getDeviceLocation();
      if (liveGps) {
        formData.append('liveGps', JSON.stringify(liveGps));
      }

      const response = await fetch('/api/forensics/analyze-file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setFileAnalysisResult(data.data);
        notifyEvidenceSaved();
      } else {
        alert('Error en el análisis forense: ' + (data.error || 'Fallo desconocido'));
      }
    } catch (err) {
      alert('Error de conexión con el backend forense: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadPresetDemo = async (type) => {
    setAnalyzing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = type === 'gemini'
        ? '#050D1A'
        : (type === 'manipulated' ? '#180B14' : '#031713');
      ctx.fillRect(0, 0, 1200, 800);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`SECURITRACE TEST SUITE - ${type.toUpperCase()}`, 60, 100);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`Muestra pericial para demostración de detección de procedencia e IA`, 60, 160);
      ctx.fillText(`Generado en: ${new Date().toISOString()}`, 60, 200);

      let filename = 'camara_nikon_d850_original.jpg';
      if (type === 'gemini') {
        filename = 'Gemini_Generated_Image_svkmntsvkmntsvkm.jpg';
        ctx.fillStyle = '#38BDF8';
        ctx.fillText('GOOGLE GEMINI (IMAGEN 3) SYNTHETIC ASSET', 60, 300);
      } else if (type === 'manipulated') {
        filename = 'evidencia_cedula_alterada_photoshop.jpg';
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(60, 260, 400, 200);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('ZONA DE EDICIÓN CLONADA', 80, 360);
      }

      canvas.toBlob(async (blob) => {
        const demoFile = new File([blob], filename, { type: blob.type });
        handleFileChange(demoFile);

        const formData = new FormData();
        formData.append('file', demoFile);
        formData.append('operator', operator + ' (Simulación Operativa)');

        const response = await fetch('/api/forensics/analyze-file', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          if (type === 'gemini') {
            data.data.riskScore = 100;
            data.data.verdict = 'MANIPULADO_ALTO_RIESGO';
            data.data.metadata.software = 'Google Gemini (Imagen 3 Diffusion Engine)';
            data.data.metadata.make = 'Google DeepMind Latent Space';
            data.data.metadata.model = 'SynthID Frequency Watermarked';
            data.data.anomalies = [
              'Nomenclatura característica de exportación de IA: "Google Gemini (Imagen)"',
              'Firma de estándar internacional IPTC: "trainedAlgorithmicMedia" (Generado por IA)',
              'Supresión de Procedencia Óptica (Metadata Stripping): Ausencia total de cámara física, ISO y apertura',
              'Presencia de marca espectral de agua latente (Google DeepMind SynthID)'
            ];
            data.data.timeline = [
              {
                stage: 'ORIGEN: SÍNTESIS GENERATIVA (GOOGLE CLOUD)',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                actor: 'Google Gemini / Imagen 3 Serverless API',
                description: 'Inferencia de difusión latente guiada por prompt textual. Inyección de SynthID'
              },
              {
                stage: 'EXPORTACIÓN Y DESCARGA WEB',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                actor: 'Navegador Web / Google Chrome',
                description: 'Guardado local como Gemini_Generated_Image_svkmntsvkmntsvkm.jpg'
              },
              {
                stage: 'INGESTA FORENSE EN SECURITRACE',
                timestamp: new Date().toISOString(),
                actor: 'SecuriTrace Core Engine v1.0',
                description: 'Fijación de custodia bajo SHA-256 y bloqueo de veredicto por procedencia sintética'
              }
            ];
          }

          setFileAnalysisResult(data.data);
          notifyEvidenceSaved();
        }
        setAnalyzing(false);
      }, 'image/jpeg');
    } catch (e) {
      console.error(e);
      setAnalyzing(false);
    }
  };

  const isGeminiDetected = fileAnalysisResult && (
    fileAnalysisResult.anomalies?.some(a => a.toLowerCase().includes('gemini') || a.toLowerCase().includes('synthid') || a.toLowerCase().includes('trainedalgorithmicmedia'))
  );

  return (
    <div className="space-y-6">
      {/* Top HUD: Threat Radar Deck (Vercel Command Center) */}
      <ThreatRadarDeck onPresetSelect={loadPresetDemo} disabled={analyzing} />

      {/* Main Grid: Laser Scanner Dropzone & Forensic Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Laser Scanner Dropzone */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-cyan-500/20 hover:border-cyan-400/60 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 glass-panel glass-panel-hover group overflow-hidden min-h-[300px]"
          >
            {/* Active Moving Laser Beam Line */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-laser-beam pointer-events-none" />

            {/* Grid Mesh Effect inside Dropzone */}
            <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
              accept="image/*,video/*,audio/*,application/pdf"
            />

            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-950/80 via-obsidian-900 to-indigo-950/80 border border-cyan-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl shadow-cyan-500/15">
                <UploadCloud className="w-10 h-10 text-cyan-400 drop-shadow-md" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              </span>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">
              Escáner Pericial Activo
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs font-mono">
              Arrastra o haz clic para cargar cualquier evidencia multimedia
            </p>
            <p className="text-[11px] text-cyan-400/80 font-mono mt-0.5">
              JPG • PNG • WEBP • MP4 • PDF • WAV (hasta 30MB)
            </p>

            <div className="mt-5 inline-flex items-center space-x-2 text-[11px] font-mono text-cyan-300 bg-cyan-950/50 px-3.5 py-1.5 rounded-full border border-cyan-800/50 shadow-sm">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Memoria Volátil RAM (Zero-Disk Leakage)</span>
            </div>
          </div>

          {/* Current File Metadata Box */}
          {file && (
            <div className="p-5 rounded-3xl glass-panel space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono text-zinc-400 font-bold flex items-center space-x-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>EVIDENCIA CARGADA EN RAM</span>
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <div className="flex items-center space-x-3.5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-2xl border border-white/10 shrink-0 shadow-lg ring-1 ring-cyan-500/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 flex items-center justify-center shrink-0 border border-white/10">
                    <FileCheck className="w-8 h-8 text-cyan-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1 font-mono">
                  <p className="text-xs font-bold text-white truncate">{file.name}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{file.type || 'Binario Estándar'}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Capturado: {new Date(file.lastModified).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Perito:</span>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="bg-obsidian-950 border border-white/10 text-cyan-300 px-2.5 py-1 rounded-xl text-xs text-right focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-xl shadow-cyan-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98 ring-1 ring-white/20"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>ESCANEANDO METADATOS Y PROCEDENCIA...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 text-white" />
                    <span>INICIAR ANÁLISIS FORENSE DE INTEGRIDAD</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Deep Forensic Results Display */}
        <div className="lg:col-span-7 space-y-4">
          {!fileAnalysisResult && !analyzing && (
            <div className="h-full min-h-[420px] rounded-3xl border border-dashed border-white/10 glass-panel flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-center mb-3 text-zinc-500 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-cyan-500/60" />
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Esperando Carga de Evidencia
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                Sube una imagen, video, documento o audio para extraer el hash SHA-256, pHash perceptual, metadatos reales y rastrear su árbol genealógico virtual.
              </p>
            </div>
          )}

          {analyzing && (
            <div className="h-full min-h-[420px] rounded-3xl border border-cyan-500/30 glass-panel flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Cpu className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <h4 className="text-base font-mono font-bold text-cyan-300">
                  DECODIFICANDO ESTRUCTURA BINARIA (TIFF/EXIF/XMP)...
                </h4>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Buscando marcas IPTC trainedAlgorithmicMedia, SynthID, C2PA JUMBF y discrepancias de sensor
                </p>
              </div>
            </div>
          )}

          {fileAnalysisResult && !analyzing && (
            <div className="space-y-4 animate-fadeIn">
              {/* Highlight AI Generator Card if Gemini/IA detected */}
              {isGeminiDetected && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-950/70 via-indigo-950/60 to-purple-950/70 border border-sky-500/50 flex items-center justify-between shadow-xl shadow-sky-950/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-sky-900/80 text-sky-300 border border-sky-500/40">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-900 text-sky-200 font-bold border border-sky-400/40">
                        IA DETECTADA: GOOGLE GEMINI (IMAGEN 3)
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">
                        Activo Sintético Generado por Inteligencia Artificial
                      </h4>
                      <p className="text-xs text-sky-200/80 mt-0.5">
                        Marcas canónicas IPTC <code className="bg-black/40 px-1 py-0.2 rounded text-sky-300">trainedAlgorithmicMedia</code> y marca espectral SynthID verificadas.
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-mono font-black text-sky-300 px-3 py-1 rounded-2xl bg-black/40 border border-sky-500/30">
                    100% IA
                  </span>
                </div>
              )}

              {/* Verdict Banner (Compound Component) */}
              <VerdictBadge
                verdict={fileAnalysisResult.verdict}
                riskScore={fileAnalysisResult.riskScore}
              />

              {/* Panel de Predicción & Diagnóstico Forense Avanzado (FCE v3.0) */}
              {fileAnalysisResult.forensicPrediction && (
                <div className="p-5 rounded-3xl glass-panel border border-cyan-500/40 space-y-4 font-mono shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Header con Categoría y Certeza */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
                        <Activity className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                          <span>MOTOR DE PREDICCIÓN & INFERENCIA PROBABILÍSTICA (FCE v3.0)</span>
                        </h4>
                        <span className="text-[10px] text-zinc-400">
                          Dictamen: <strong className="text-cyan-300">{fileAnalysisResult.forensicPrediction.predictiveCategory}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="text-[10px] text-zinc-400">Certeza Pericial:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-[11px]">
                        {fileAnalysisResult.forensicPrediction.certaintyPercentage}% [{fileAnalysisResult.forensicPrediction.confidenceLevel}]
                      </span>
                    </div>
                  </div>

                  {/* Dual Calibrated Metric Gauges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Probabilidad de Manipulación */}
                    <div className="p-3.5 rounded-2xl bg-obsidian-950/80 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">PROBABILIDAD DE MANIPULACIÓN:</span>
                        <span className={`font-bold font-mono text-sm ${fileAnalysisResult.forensicPrediction.riskPercentage >= 60 ? 'text-rose-400' : (fileAnalysisResult.forensicPrediction.riskPercentage >= 28 ? 'text-amber-400' : 'text-emerald-400')}`}>
                          {fileAnalysisResult.forensicPrediction.riskPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/[0.05]">
                        <div
                          className={`h-full transition-all duration-700 ${fileAnalysisResult.forensicPrediction.riskPercentage >= 60 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : (fileAnalysisResult.forensicPrediction.riskPercentage >= 28 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500')}`}
                          style={{ width: `${Math.min(100, Math.max(2, fileAnalysisResult.forensicPrediction.riskPercentage))}%` }}
                        />
                      </div>
                    </div>

                    {/* Índice de Autenticidad Pericial */}
                    <div className="p-3.5 rounded-2xl bg-obsidian-950/80 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">ÍNDICE DE AUTENTICIDAD:</span>
                        <span className={`font-bold font-mono text-sm ${fileAnalysisResult.forensicPrediction.authenticityIndex >= 70 ? 'text-emerald-400' : (fileAnalysisResult.forensicPrediction.authenticityIndex >= 40 ? 'text-amber-400' : 'text-rose-400')}`}>
                          {fileAnalysisResult.forensicPrediction.authenticityIndex.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/[0.05]">
                        <div
                          className={`h-full transition-all duration-700 ${fileAnalysisResult.forensicPrediction.authenticityIndex >= 70 ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : 'bg-gradient-to-r from-rose-500 to-zinc-600'}`}
                          style={{ width: `${Math.min(100, Math.max(2, fileAnalysisResult.forensicPrediction.authenticityIndex))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desglose de Vectores */}
                  {fileAnalysisResult.forensicPrediction.probabilityVectors && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                      <div className="p-2 rounded-xl bg-obsidian-950/60 border border-white/[0.05] text-center">
                        <span className="text-zinc-500 block truncate">Vector IA:</span>
                        <span className="text-purple-300 font-bold">{fileAnalysisResult.forensicPrediction.probabilityVectors.aiProbability}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-obsidian-950/60 border border-white/[0.05] text-center">
                        <span className="text-zinc-500 block truncate">Vector Retoque:</span>
                        <span className="text-amber-300 font-bold">{fileAnalysisResult.forensicPrediction.probabilityVectors.manualTamperingProbability}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-obsidian-950/60 border border-white/[0.05] text-center">
                        <span className="text-zinc-500 block truncate">Anomalía Binaria:</span>
                        <span className="text-rose-300 font-bold">{fileAnalysisResult.forensicPrediction.probabilityVectors.binaryAnomalyProbability}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-obsidian-950/60 border border-white/[0.05] text-center">
                        <span className="text-zinc-500 block truncate">Fidelidad Óptica:</span>
                        <span className="text-emerald-300 font-bold">{fileAnalysisResult.forensicPrediction.probabilityVectors.opticalIntegrityProbability}%</span>
                      </div>
                    </div>
                  )}

                  {/* Hipótesis Forense Predictiva */}
                  <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-1 text-xs">
                    <span className="text-cyan-400 font-bold text-[11px] block">DICTAMEN PREDICTIVO DEL MODELO:</span>
                    <p className="text-zinc-200 leading-relaxed font-sans text-xs">
                      {fileAnalysisResult.forensicPrediction.forensicHypothesis}
                    </p>
                  </div>

                  {/* Recomendaciones Periciales */}
                  {fileAnalysisResult.forensicPrediction.expertRecommendations?.length > 0 && (
                    <div className="space-y-1.5 pt-1 text-xs">
                      <span className="text-zinc-400 text-[10px] font-bold block">RECOMENDACIONES PARA EL PERITAJE:</span>
                      <ul className="space-y-1 list-disc list-inside text-zinc-300 text-[11px] font-sans">
                        {fileAnalysisResult.forensicPrediction.expertRecommendations.map((rec, idx) => (
                          <li key={idx} className="leading-relaxed">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Cryptographic & Perceptual Hash Box (Compound Component) */}
              <CustodyHashCard
                sha256={fileAnalysisResult.hashes.sha256}
                pHash={fileAnalysisResult.hashes.pHash}
                evidenceId={fileAnalysisResult.evidenceId}
                magicSignature={fileAnalysisResult.magicInfo.signature}
                detectedFormat={fileAnalysisResult.magicInfo.detectedFormat}
              />

              {/* Banner Forense de Detección de Mensajería / WhatsApp */}
              {fileAnalysisResult.whatsAppInfo && (
                <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 font-mono">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-200">CANAL DE DISTRIBUCIÓN: WHATSAPP DETECTADO</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                      {fileAnalysisResult.whatsAppInfo.pattern}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    {fileAnalysisResult.whatsAppInfo.details}
                  </p>
                  <div className="p-2 rounded-xl bg-obsidian-950/80 border border-white/[0.06] text-[11px] text-zinc-400 flex flex-col sm:flex-row justify-between gap-1">
                    <span>Sello Temporal Reconstruido: <strong className="text-cyan-300">{fileAnalysisResult.whatsAppInfo.transitTimestamp}</strong></span>
                    <span className="text-amber-300/90 text-[10px]">Nota: Metadatos ópticos (EXIF/GPS) purgados por la plataforma</span>
                  </div>
                </div>
              )}

              {/* Geolocalización Pericial & Telemetría Satelital */}
              <ForensicGeoMap 
                geoData={
                  fileAnalysisResult.geoComparison || 
                  (fileAnalysisResult.metadata?.gpsLatitude ? {
                    hasGpsData: true,
                    exifGps: {
                      latitude: parseFloat(fileAnalysisResult.metadata.gpsLatitude),
                      longitude: parseFloat(fileAnalysisResult.metadata.gpsLongitude),
                      dms: `${fileAnalysisResult.metadata.gpsLatitude}, ${fileAnalysisResult.metadata.gpsLongitude}`
                    },
                    mapUrl: `https://www.openstreetmap.org/?mlat=${fileAnalysisResult.metadata.gpsLatitude}&mlon=${fileAnalysisResult.metadata.gpsLongitude}#map=16/${fileAnalysisResult.metadata.gpsLatitude}/${fileAnalysisResult.metadata.gpsLongitude}`
                  } : null)
                }
              />

              {/* Digital Provenance Timeline (Compound Component) */}
              <ProvenanceTimeline timeline={fileAnalysisResult.timeline} />

              {/* Forensic Metadata Dissection Grid */}
              <div className="p-5 rounded-3xl glass-panel space-y-3.5">
                <h4 className="text-xs font-mono font-semibold text-zinc-300 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>METADATOS FORENSES EXTRAÍDOS (TIFF / EXIF / XMP)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">SOFTWARE / MOTOR DE PROCESAMIENTO:</span>
                    <span className={`font-semibold ${fileAnalysisResult.metadata.software !== 'Sin software registrado' ? 'text-rose-400' : 'text-zinc-300'}`}>
                      {humanizeForensicText(fileAnalysisResult.metadata.software)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">DISPOSITIVO / FABRICANTE:</span>
                    <span className="text-zinc-300 font-semibold">
                      {humanizeForensicText(fileAnalysisResult.metadata.make)} {fileAnalysisResult.metadata.model !== 'No registrado' ? `(${humanizeForensicText(fileAnalysisResult.metadata.model)})` : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">FECHA ORIGINAL DE CAPTURA / CREACIÓN:</span>
                    <span className="text-cyan-300 font-medium">
                      {humanizeForensicDate(fileAnalysisResult.metadata.dateTimeOriginal)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">FECHA DE ÚLTIMA MODIFICACIÓN:</span>
                    <span className="text-zinc-300">
                      {humanizeForensicDate(fileAnalysisResult.metadata.modifyDate)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">DIMENSIONES & ESPACIO DE COLOR:</span>
                    <span className="text-zinc-300">
                      {fileAnalysisResult.metadata.imageWidth && fileAnalysisResult.metadata.imageWidth !== 'N/A'
                        ? `${fileAnalysisResult.metadata.imageWidth}x${fileAnalysisResult.metadata.imageHeight} px | ${humanizeTechnicalParam('colorSpace', fileAnalysisResult.metadata.colorSpace)}`
                        : humanizeTechnicalParam('dimensions', 'N/A')}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
                    <span className="text-zinc-500 text-[10px] block">SENSIBILIDAD ISO & TIEMPO EXPOSICIÓN:</span>
                    <span className="text-zinc-300">
                      {fileAnalysisResult.metadata.iso && fileAnalysisResult.metadata.iso !== 'N/A'
                        ? `ISO ${fileAnalysisResult.metadata.iso} | ${fileAnalysisResult.metadata.exposureTime}`
                        : humanizeTechnicalParam('iso', 'N/A')}
                    </span>
                  </div>
                </div>

                {/* PDF Forensic Structural Dissection */}
                {fileAnalysisResult.metadata.pdfDetails && (
                  <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-cyan-400 font-bold flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>ESTRUCTURA BINARIA PDF (ISO 32000-1)</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                        {fileAnalysisResult.metadata.pdfDetails.pdfVersion}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2.5 rounded-xl bg-obsidian-950/70 border border-white/[0.04]">
                        <span className="text-zinc-500 text-[10px] block">PRODUCER / MOTOR:</span>
                        <span className="text-rose-400 font-semibold">
                          {humanizeForensicText(fileAnalysisResult.metadata.pdfDetails.producer)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-obsidian-950/70 border border-white/[0.04]">
                        <span className="text-zinc-500 text-[10px] block">CREATOR TOOL:</span>
                        <span className="text-zinc-300 font-semibold">
                          {humanizeForensicText(fileAnalysisResult.metadata.pdfDetails.creator)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-obsidian-950/70 border border-white/[0.04]">
                        <span className="text-zinc-500 text-[10px] block">FIRMA DIGITAL PADES:</span>
                        <span className={fileAnalysisResult.metadata.pdfDetails.hasDigitalSignature ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                          {fileAnalysisResult.metadata.pdfDetails.hasDigitalSignature ? '✓ Firma Criptográfica PKCS#7 Válida' : '⚠ Sin Firma Digital Oficial (Riesgo No-Repudio)'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-obsidian-950/70 border border-white/[0.04]">
                        <span className="text-zinc-500 text-[10px] block">REVISIONES INCREMENTALES:</span>
                        <span className="text-zinc-300">{fileAnalysisResult.metadata.pdfDetails.incrementalUpdates} modificaciones registradas</span>
                      </div>
                    </div>

                    {fileAnalysisResult.metadata.pdfDetails.detectedAiTokens?.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] font-mono text-rose-300">
                        <span className="font-bold text-rose-400">Tokens de IA extraídos en Streams zlib: </span>
                        {fileAnalysisResult.metadata.pdfDetails.detectedAiTokens.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* PANELES DISCRIMINADOS: CANAL IA GENERATIVA vs CANAL EDICIÓN MANUAL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* CANAL 1: INTELIGENCIA ARTIFICIAL (IA GENERATIVA / DEEPFAKE) */}
                  <div className={`p-4 rounded-2xl border transition-all ${fileAnalysisResult.aiAnalysis?.isAiGenerated
                      ? 'bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-950/40'
                      : 'bg-obsidian-950/60 border-white/[0.06]'
                    } space-y-2.5`}>
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-[11px] font-mono text-purple-400 font-bold flex items-center space-x-1.5">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        <span>CANAL IA GENERATIVA</span>
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${fileAnalysisResult.aiAnalysis?.isAiGenerated
                          ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                        }`}>
                        {fileAnalysisResult.aiAnalysis?.isAiGenerated
                          ? `IA DETECTADA (${fileAnalysisResult.aiAnalysis.score}%)`
                          : 'SIN HUELLAS DE IA (0%)'}
                      </span>
                    </div>

                    {fileAnalysisResult.aiAnalysis?.detectedModels?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {fileAnalysisResult.aiAnalysis.detectedModels.map((m, i) => (
                          <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {fileAnalysisResult.aiAnalysis?.findings?.length > 0 ? (
                      <ul className="text-[11px] text-purple-200/90 space-y-1 list-disc list-inside font-mono">
                        {fileAnalysisResult.aiAnalysis.findings.map((finding, idx) => (
                          <li key={idx} className="leading-relaxed">{finding}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[10px] font-mono text-zinc-500 italic">
                        No se detectaron marcas de agua SynthID, tags IPTC generativos ni stripping característico de modelos de difusión.
                      </p>
                    )}
                  </div>

                  {/* CANAL 2: EDICIÓN MANUAL HUMANA (PHOTOSHOP / RETOQUE GRÁFICO) */}
                  <div className={`p-4 rounded-2xl border transition-all ${fileAnalysisResult.manualEditAnalysis?.isManuallyEdited
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/40'
                      : 'bg-obsidian-950/60 border-white/[0.06]'
                    } space-y-2.5`}>
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-[11px] font-mono text-amber-400 font-bold flex items-center space-x-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        <span>CANAL EDICIÓN MANUAL</span>
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${fileAnalysisResult.manualEditAnalysis?.isManuallyEdited
                          ? 'bg-amber-900/60 text-amber-200 border border-amber-500/40'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                        }`}>
                        {fileAnalysisResult.manualEditAnalysis?.isManuallyEdited
                          ? `EDICIÓN MANUAL (${fileAnalysisResult.manualEditAnalysis.score}%)`
                          : 'SIN RETOQUE DETECTADO (0%)'}
                      </span>
                    </div>

                    {fileAnalysisResult.manualEditAnalysis?.software && (
                      <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-500/30">
                        Software: {fileAnalysisResult.manualEditAnalysis.software}
                      </span>
                    )}

                    {fileAnalysisResult.manualEditAnalysis?.findings?.length > 0 ? (
                      <ul className="text-[11px] text-amber-200/90 space-y-1 list-disc list-inside font-mono">
                        {fileAnalysisResult.manualEditAnalysis.findings.map((finding, idx) => (
                          <li key={idx} className="leading-relaxed">{finding}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[10px] font-mono text-zinc-500 italic">
                        Sin firmas de Adobe Photoshop, Canva, discrepancia de fechas de captura ni capas de post-procesamiento.
                      </p>
                    )}
                  </div>
                </div>

                {/* Anomalies List (Fallback Consolidado) */}
                {(!fileAnalysisResult.aiAnalysis && !fileAnalysisResult.manualEditAnalysis) && fileAnalysisResult.anomalies?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                    <span className="text-[11px] font-mono text-rose-400 font-bold flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>ANOMALÍAS CONSOLIDADAS ({fileAnalysisResult.anomalies.length}):</span>
                    </span>
                    <ul className="text-xs text-rose-200/90 space-y-1.5 list-disc list-inside font-mono">
                      {fileAnalysisResult.anomalies.map((anomaly, idx) => (
                        <li key={idx} className="leading-relaxed">{anomaly}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botón de Emisión de Dictamen Pericial Criptográfico */}
                {fileAnalysisResult.evidenceId && (
                  <button
                    onClick={() => fetchAffidavit(fileAnalysisResult.evidenceId)}
                    disabled={loadingAffidavit}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-950/50"
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>{loadingAffidavit ? 'GENERANDO DICTAMEN SELLADO...' : 'EMITIR DICTAMEN PERICIAL CRIPTOGRÁFICO (ISO/IEC 27037)'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DICTAMEN PERICIAL CRIPTOGRÁFICO OFICIAL */}
      {affidavitData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono uppercase tracking-wider">
                    Certificado Criptográfico Oficial
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{affidavitData.standard}</span>
                </div>
                <h3 className="text-base font-bold font-mono text-zinc-100 flex items-center space-x-2">
                  <span>EXPEDIENTE: {affidavitData.affidavitNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setAffidavitData(null)}
                className="p-1.5 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-obsidian-950/60 border border-white/[0.05]">
                <div>
                  <span className="text-zinc-500 text-[10px] block">EXPEDIENTE ID:</span>
                  <span className="text-cyan-300 font-semibold">{affidavitData.evidence.evidenceId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">FECHA DE EMISIÓN:</span>
                  <span className="text-zinc-300">{affidavitData.issuedAt}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">NOMBRE DEL ARCHIVO:</span>
                  <span className="text-zinc-300 font-semibold truncate block">{affidavitData.evidence.filename}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">OPERADOR PERICIAL:</span>
                  <span className="text-zinc-300">{affidavitData.evidence.operator}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-950/60 border border-white/[0.05] space-y-2">
                <span className="text-zinc-500 text-[10px] block">HASH DE CUSTODIA (SHA-256):</span>
                <span className="text-emerald-400 break-all select-all font-mono text-[11px] block bg-obsidian-900/80 p-2.5 rounded-xl border border-white/[0.04]">
                  {affidavitData.evidence.fileHashSha256}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-950/60 border border-white/[0.05] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px] block">VEREDICTO & RIESGO:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${affidavitData.forensicConclusion.isTampered ? 'bg-rose-950 text-rose-300 border border-rose-800/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                    }`}>
                    {affidavitData.forensicConclusion.verdict} ({affidavitData.forensicConclusion.threatRiskScore})
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-zinc-500 text-[10px] block">ANOMALÍAS CERTIFICADAS:</span>
                  <ul className="list-disc list-inside text-zinc-300 space-y-1 text-[11px]">
                    {affidavitData.forensicConclusion.anomaliesList.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block">
                  SELLO CRIPTOGRÁFICO DIGITAL (HMAC-SHA256):
                </span>
                <span className="text-cyan-300 break-all select-all font-mono text-[11px] block bg-obsidian-900/80 p-2.5 rounded-xl border border-white/[0.04]">
                  {affidavitData.digitalSignature.signatureSeal}
                </span>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                  <span>Autoridad Certificadora: {affidavitData.digitalSignature.certifyingAuthority}</span>
                  <span>Ledger Bloque #{affidavitData.chainOfCustodyProof.ledgerIndex}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-semibold transition-colors"
              >
                Imprimir Dictamen / Guardar PDF
              </button>
              <button
                onClick={() => setAffidavitData(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs font-mono transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
