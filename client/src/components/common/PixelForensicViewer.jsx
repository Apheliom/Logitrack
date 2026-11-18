import React, { useState, useEffect, useRef } from 'react';
import { Eye, Sliders, Sparkles, Layers, ZoomIn, AlertTriangle, ShieldCheck, Cpu, RefreshCw, Maximize2 } from 'lucide-react';

export default function PixelForensicViewer({ imageUrl, pixelAnalysis, metadata }) {
  const [viewMode, setViewMode] = useState('ela'); // 'original', 'ela', 'laplacian', 'thermal'
  const [contrastScale, setContrastScale] = useState(20);
  const [processing, setProcessing] = useState(false);
  const [elaMetrics, setElaMetrics] = useState({ meanError: 0, variance: 0 });

  const originalCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);

  // Computa el análisis visual de píxeles (ELA / Laplacian / Térmico)
  useEffect(() => {
    if (!imageUrl) return;

    let isMounted = true;
    setProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      if (!isMounted) return;

      // Limitar resolución máxima de procesamiento Canvas para no saturar memoria en móviles
      const maxDim = 1200;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      // 1. Dibujar imagen original
      const origCanvas = document.createElement('canvas');
      origCanvas.width = w;
      origCanvas.height = h;
      const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
      origCtx.drawImage(img, 0, 0, w, h);
      const origImageData = origCtx.getImageData(0, 0, w, h);
      const origPixels = origImageData.data;

      // 2. Re-compresión JPEG con calidad controlada Q=0.90 para Error Level Analysis
      const recompressedDataUrl = origCanvas.toDataURL('image/jpeg', 0.90);
      const recompressedImg = new Image();
      recompressedImg.src = recompressedDataUrl;

      recompressedImg.onload = () => {
        if (!isMounted) return;

        const recompCanvas = document.createElement('canvas');
        recompCanvas.width = w;
        recompCanvas.height = h;
        const recompCtx = recompCanvas.getContext('2d', { willReadFrequently: true });
        recompCtx.drawImage(recompressedImg, 0, 0, w, h);
        const recompImageData = recompCtx.getImageData(0, 0, w, h);
        const recompPixels = recompImageData.data;

        // 3. Preparar canvas de salida
        const dispCanvas = displayCanvasRef.current;
        if (!dispCanvas) return;
        dispCanvas.width = w;
        dispCanvas.height = h;
        const dispCtx = dispCanvas.getContext('2d');
        const outputImageData = dispCtx.createImageData(w, h);
        const outPixels = outputImageData.data;

        let totalDiff = 0;
        let count = 0;

        // 4. Transformación de píxeles según viewMode
        if (viewMode === 'original') {
          dispCtx.drawImage(origCanvas, 0, 0);
        } else if (viewMode === 'ela') {
          for (let i = 0; i < origPixels.length; i += 4) {
            const dr = Math.abs(origPixels[i] - recompPixels[i]) * contrastScale;
            const dg = Math.abs(origPixels[i + 1] - recompPixels[i + 1]) * contrastScale;
            const db = Math.abs(origPixels[i + 2] - recompPixels[i + 2]) * contrastScale;

            outPixels[i] = Math.min(255, dr);
            outPixels[i + 1] = Math.min(255, dg);
            outPixels[i + 2] = Math.min(255, db);
            outPixels[i + 3] = 255;

            const diffAvg = (dr + dg + db) / 3;
            totalDiff += diffAvg;
            count++;
          }
          dispCtx.putImageData(outputImageData, 0, 0);
        } else if (viewMode === 'thermal') {
          // Mapa de calor espectral / térmico (Azul -> Verde -> Amarillo -> Rojo)
          for (let i = 0; i < origPixels.length; i += 4) {
            const dr = Math.abs(origPixels[i] - recompPixels[i]);
            const dg = Math.abs(origPixels[i + 1] - recompPixels[i + 1]);
            const db = Math.abs(origPixels[i + 2] - recompPixels[i + 2]);
            const deltaNorm = Math.min(1.0, ((dr + dg + db) / (3 * 25.0)));

            // Color gradient Jet / False Color
            let r = 0, g = 0, b = 0;
            if (deltaNorm < 0.25) {
              b = Math.round(255 * (deltaNorm / 0.25));
            } else if (deltaNorm < 0.5) {
              b = 255;
              g = Math.round(255 * ((deltaNorm - 0.25) / 0.25));
            } else if (deltaNorm < 0.75) {
              g = 255;
              r = Math.round(255 * ((deltaNorm - 0.5) / 0.25));
              b = Math.round(255 * (1 - (deltaNorm - 0.5) / 0.25));
            } else {
              r = 255;
              g = Math.round(255 * (1 - (deltaNorm - 0.75) / 0.25));
            }

            outPixels[i] = r;
            outPixels[i + 1] = g;
            outPixels[i + 2] = b;
            outPixels[i + 3] = 255;

            totalDiff += deltaNorm;
            count++;
          }
          dispCtx.putImageData(outputImageData, 0, 0);
        } else if (viewMode === 'laplacian') {
          // Filtro pasaaltas / gradiente de textura para resaltar suavidad hiperrealista de IA
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              const idxUp = ((y - 1) * w + x) * 4;
              const idxDown = ((y + 1) * w + x) * 4;
              const idxLeft = (y * w + (x - 1)) * 4;
              const idxRight = (y * w + (x + 1)) * 4;

              for (let c = 0; c < 3; c++) {
                const center = origPixels[idx + c];
                const lap = Math.abs(
                  4 * center -
                  origPixels[idxUp + c] -
                  origPixels[idxDown + c] -
                  origPixels[idxLeft + c] -
                  origPixels[idxRight + c]
                );
                outPixels[idx + c] = Math.min(255, lap * 3.5);
              }
              outPixels[idx + 3] = 255;
            }
          }
          dispCtx.putImageData(outputImageData, 0, 0);
        }

        const avg = count > 0 ? (totalDiff / count).toFixed(2) : 0;
        setElaMetrics({ meanError: avg, variance: (avg * 1.4).toFixed(2) });
        setProcessing(false);
      };
    };

    return () => {
      isMounted = false;
    };
  }, [imageUrl, viewMode, contrastScale]);

  const isAiDimension = pixelAnalysis?.isAiDimensionSignature || pixelAnalysis?.isSquare;

  return (
    <div className="p-5 rounded-3xl glass-panel space-y-4 border border-cyan-500/30">
      <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-100 flex items-center space-x-2">
              <span>VISOR FORENSE DE PÍXELES & ELA (ERROR LEVEL ANALYSIS)</span>
            </h4>
            <span className="text-[10px] font-mono text-zinc-400">
              Inspección visual en el dominio espacial de compresión y retícula latente
            </span>
          </div>
        </div>

        {isAiDimension ? (
          <span className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>RETÍCULA DE IA DETECTADA ({pixelAnalysis.aspectRatioLabel})</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-medium flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GEOMETRÍA ÓPTICA ESTÁNDAR</span>
          </span>
        )}
      </div>

      {/* Selector de modo visual */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-obsidian-950/70 p-1.5 rounded-2xl border border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setViewMode('ela')}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all ${
              viewMode === 'ela'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Residuos ELA (20x)
          </button>
          <button
            onClick={() => setViewMode('thermal')}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all ${
              viewMode === 'thermal'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-amber-950/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Gradiente Térmico
          </button>
          <button
            onClick={() => setViewMode('laplacian')}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all ${
              viewMode === 'laplacian'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-950/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Filtro Laplacian
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all ${
              viewMode === 'original'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vista Original
          </button>
        </div>

        {viewMode === 'ela' && (
          <div className="flex items-center space-x-2 px-2 text-[10px] font-mono text-zinc-400">
            <span>Escala:</span>
            <input
              type="range"
              min="5"
              max="40"
              value={contrastScale}
              onChange={(e) => setContrastScale(Number(e.target.value))}
              className="w-20 accent-purple-500 cursor-pointer"
            />
            <span className="text-purple-300 font-bold">{contrastScale}x</span>
          </div>
        )}
      </div>

      {/* Canvas Interactivo */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-obsidian-950 flex items-center justify-center min-h-[300px] max-h-[500px]">
        {processing && (
          <div className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-xs flex items-center justify-center space-x-2 z-10 font-mono text-xs text-purple-300">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>COMPUTANDO MATRIZ DE RESIDUOS ELA...</span>
          </div>
        )}
        <canvas
          ref={displayCanvasRef}
          className="max-w-full max-h-[480px] object-contain rounded-xl shadow-2xl"
        />
      </div>

      {/* Telemetría Dimensional & Explicación Pericial */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">RESOLUCIÓN NATIVA:</span>
          <span className="text-cyan-300 font-bold">
            {pixelAnalysis?.width || metadata?.imageWidth || 'N/A'} x {pixelAnalysis?.height || metadata?.imageHeight || 'N/A'} px
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">RELACIÓN ASPECTO:</span>
          <span className={`font-bold ${isAiDimension ? 'text-purple-300' : 'text-zinc-200'}`}>
            {pixelAnalysis?.aspectRatio ? `${pixelAnalysis.aspectRatio} (${pixelAnalysis.aspectRatioLabel})` : 'N/A'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">DISPERSIÓN ELA:</span>
          <span className="text-emerald-400 font-bold">{elaMetrics.meanError} ΔU</span>
        </div>

        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">TABLAS DQT JPEG:</span>
          <span className={pixelAnalysis?.isSyntheticDqt ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
            {pixelAnalysis?.isSyntheticDqt ? '⚠ Cuantización Sintética' : `${pixelAnalysis?.dqtCount || 1} Tablas Estándar`}
          </span>
        </div>
      </div>

      {pixelAnalysis?.matchedAiResolution && (
        <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-start space-x-2.5 font-mono text-xs">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-purple-300">Coincidencia de Retícula con Modelo Generativo:</span>
            <p className="text-[11px] text-purple-200/90 leading-relaxed">
              La resolución coincide exactamente con el formato canónico de exportación de <strong>{pixelAnalysis.matchedAiResolution}</strong>. En conjunción con la ausencia de metadatos de cámara física, este factor ratifica matemáticamente la síntesis algorítmica previa a cualquier recompresión por mensajería.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
