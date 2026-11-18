import React from 'react';
import { MapPin, Navigation, Compass, AlertTriangle, ShieldCheck, ExternalLink, ShieldAlert, Radio, Globe, LocateFixed } from 'lucide-react';

export default function ForensicGeoMap({ geoData }) {
  // Caso 1: Si no hay coordenadas GPS incrustadas
  if (!geoData || !geoData.hasGpsData) {
    const isDeclaredZone = geoData?.operationalZone;

    return (
      <div className="p-5 rounded-3xl glass-panel space-y-3.5 border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-zinc-100 flex items-center space-x-2">
                <span>GEOLOCALIZACIÓN PERICIAL & TRAZABILIDAD ESPACIAL</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">
                Inspección de metadatos de posicionamiento satelital (WGS 84 / EXIF GPS IFD)
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-400 font-mono text-[10px] font-medium flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>SIN COORDENADAS INCRUSTADAS</span>
          </span>
        </div>

        {isDeclaredZone && (
          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <LocateFixed className="w-4 h-4 text-cyan-400" />
              <span className="text-zinc-300">Zona Operativa Declarada en Terminal:</span>
            </div>
            <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/40">
              {isDeclaredZone}
            </span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-obsidian-950/70 border border-white/[0.05] space-y-2 text-xs font-mono">
          <div className="text-zinc-300 font-semibold flex items-center space-x-2 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Diagnóstico Forense de Ausencia de Telemetría GPS:</span>
          </div>
          <ul className="text-zinc-400 text-[11px] space-y-1.5 list-disc list-inside">
            <li>
              <strong className="text-zinc-300">Sanitización por Plataforma (WhatsApp / Telegram / Web):</strong> Los servicios de mensajería instantánea transcodifican la imagen y descartan por completo el bloque binario <code className="text-cyan-300">APP1 (EXIF GPS IFD)</code> para privacidad del usuario.
            </li>
            <li>
              <strong className="text-zinc-300">Sensor GPS Desactivado o Navegador en HTTP:</strong> La API de geolocalización móvil bloquea lecturas de sensores en redes locales HTTP sin certificado SSL, delegando la fijación a los metadatos nativos del archivo o a la zona declarada.
            </li>
            <li>
              <strong className="text-zinc-300">Preservación Recomendada:</strong> Para que las fotos tomadas en el móvil conserven sus coordenadas satelitales exactas al enviarse, deben compartirse como <em>"Documento"</em> (sin compresión destructiva).
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const { liveGps, exifGps, declaredGps, discrepancyKm, isGpsSpoofed, operationalZone } = geoData;
  const effectiveGps = exifGps || liveGps || declaredGps;
  const lat = effectiveGps.latitude;
  const lon = effectiveGps.longitude;

  // OpenStreetMap embed URL
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.008}%2C${lat - 0.008}%2C${lon + 0.008}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div className="p-5 rounded-3xl glass-panel space-y-4 border border-cyan-500/30">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <MapPin className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-100 flex items-center space-x-2">
              <span>GEOLOCALIZACIÓN PERICIAL & TELEMETRÍA SATELITAL</span>
            </h4>
            <span className="text-[10px] font-mono text-zinc-400">
              Coordenadas de captura espacial (WGS 84 / GPS Global)
            </span>
          </div>
        </div>

        {isGpsSpoofed ? (
          <span className="px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-600/50 text-rose-300 font-mono text-[10px] font-bold flex items-center space-x-1 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>GPS SPOOFING DETECTADO ({discrepancyKm} km)</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>POSICIÓN VERIFICADA EN SITIO</span>
          </span>
        )}
      </div>

      {/* Grid de coordenadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">COORDENADAS DECIMALES:</span>
          <span className="text-cyan-300 font-semibold">{lat.toFixed(6)}, {lon.toFixed(6)}</span>
        </div>

        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">FORMATO GRADOS (DMS):</span>
          <span className="text-zinc-200">{effectiveGps.dms || `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`}</span>
        </div>

        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">ORIGEN DE POSICIÓN:</span>
          <span className="text-zinc-300 font-semibold">
            {exifGps ? 'Sensor Óptico EXIF (Cámara)' : (liveGps ? 'Sensor GPS Dispositivo Móvil' : 'Zona Operativa Declarada')}
            {liveGps && ` (±${liveGps.accuracyMeters}m)`}
          </span>
        </div>
      </div>

      {operationalZone && (
        <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/[0.06] text-xs font-mono flex items-center justify-between">
          <span className="text-zinc-500 text-[11px]">Zona Operativa Vinculada:</span>
          <span className="text-cyan-300 font-bold">{operationalZone}</span>
        </div>
      )}

      {/* Mapa interactivo OpenStreetMap */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-obsidian-950 h-56 sm:h-64">
        <iframe
          title="Forensic Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={embedUrl}
          className="w-full h-full filter invert-[0.88] hue-rotate-180 contrast-125"
        />
        <div className="absolute bottom-2 right-2 flex space-x-1">
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded bg-obsidian-950/90 border border-white/20 text-[10px] font-mono text-cyan-300 flex items-center space-x-1 hover:text-white"
          >
            <span>Ver Mapa Completo</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
