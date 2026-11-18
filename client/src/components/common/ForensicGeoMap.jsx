import React from 'react';
import { MapPin, Navigation, Compass, AlertTriangle, ShieldCheck, ExternalLink, ShieldAlert, Radio, Globe, LocateFixed, UserCheck } from 'lucide-react';

export default function ForensicGeoMap({ geoData }) {
  const photoGps = geoData?.photoGps || geoData?.exifGps;
  const uploaderGps = geoData?.uploaderGps || geoData?.liveGps;
  const declaredGps = geoData?.declaredGps;
  const isDeclaredZone = geoData?.operationalZone;
  const { discrepancyKm, isGpsSpoofed } = geoData || {};

  // Caso 1: El archivo carece de coordenadas internas de captura
  if (!photoGps) {
    return (
      <div className="p-5 rounded-3xl glass-panel space-y-3.5 border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-zinc-100 flex items-center space-x-2">
                <span>GEOLOCALIZACIÓN PERICIAL & ORIGEN ESPACIAL</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">
                Inspección de metadatos de posicionamiento satelital (WGS 84 / EXIF GPS IFD)
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>SIN COORDENADAS DE CAPTURA EN EL ARCHIVO</span>
          </span>
        </div>

        {/* Panel Telemetría del Auditor (Punto de Ingesta) */}
        {uploaderGps && (
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>PUNTO DE INGESTA PERICIAL (Ubicación del Auditor / Terminal)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/30 text-cyan-200">
                ±{uploaderGps.accuracyMeters || 10}m Precisión
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-obsidian-950/80 border border-white/[0.04]">
                <span className="text-zinc-500 text-[10px] block">COORDENADAS DEL NAVEGADOR:</span>
                <span className="text-cyan-300 font-bold">{uploaderGps.latitude.toFixed(6)}, {uploaderGps.longitude.toFixed(6)}</span>
              </div>
              <div className="p-2 rounded-xl bg-obsidian-950/80 border border-white/[0.04]">
                <span className="text-zinc-500 text-[10px] block">FORMATO GRADOS DMS:</span>
                <span className="text-zinc-300">{uploaderGps.dms || 'N/A'}</span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 italic">
              * Nota de Cadena de Custodia: Estas coordenadas corresponden al terminal desde donde el auditor subió el archivo, NO al lugar donde se originó la fotografía.
            </p>
          </div>
        )}

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
            <span>Diagnóstico Forense de Ausencia de Telemetría GPS en la Foto:</span>
          </div>
          <ul className="text-zinc-400 text-[11px] space-y-1.5 list-disc list-inside">
            <li>
              <strong className="text-zinc-300">Sanitización por Red Social (WhatsApp / Telegram / Web):</strong> Las plataformas de mensajería transcodifican la imagen y eliminan permanentemente el bloque <code className="text-cyan-300">APP1 (EXIF GPS IFD)</code> por privacidad del usuario.
            </li>
            <li>
              <strong className="text-zinc-300">Generación Algorítmica por IA:</strong> Los modelos de difusión (Midjourney, DALL-E, SDXL) sintetizan píxeles sin coordenadas de captura física.
            </li>
            <li>
              <strong className="text-zinc-300">Recomendación Pericial:</strong> Para que las fotografías conserven sus coordenadas satelitales genuinas al transferirse entre teléfonos, deben enviarse siempre como <em>"Documento"</em> (sin compresión destructiva).
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Caso 2: El archivo SI contiene coordenadas GPS internas de captura óptica
  const lat = photoGps.latitude;
  const lon = photoGps.longitude;

  // OpenStreetMap embed URL centrado en la captura de la foto
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
              <span>COORDENADAS ÓPTICAS DE CAPTURA (EXIF GPS IFD)</span>
            </h4>
            <span className="text-[10px] font-mono text-zinc-400">
              Posición satelital extraída directamente del hardware de la cámara (WGS 84)
            </span>
          </div>
        </div>

        {isGpsSpoofed ? (
          <span className="px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-600/50 text-rose-300 font-mono text-[10px] font-bold flex items-center space-x-1 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>DISCREPANCIA CON AUDITOR ({discrepancyKm} km)</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GEO-TELEMETRÍA ÓPTICA VERIFICADA</span>
          </span>
        )}
      </div>

      {/* Grid de coordenadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">COORDENADAS DE CAPTURA:</span>
          <span className="text-cyan-300 font-semibold">{lat.toFixed(6)}, {lon.toFixed(6)}</span>
        </div>

        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">FORMATO GRADOS (DMS):</span>
          <span className="text-zinc-200">{photoGps.dms || `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`}</span>
        </div>

        <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/[0.06]">
          <span className="text-zinc-500 text-[10px] block">ORIGEN DE POSICIÓN:</span>
          <span className="text-emerald-400 font-semibold">
            Sensor GPS Integrado en Cámara
          </span>
        </div>
      </div>

      {/* Comparativa con telemetría del auditor si existe */}
      {uploaderGps && (
        <div className="p-3 rounded-2xl bg-obsidian-950/80 border border-white/[0.06] flex flex-wrap items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-400">Terminal del Auditor:</span>
            <span className="text-zinc-200 font-bold">{uploaderGps.latitude.toFixed(4)}, {uploaderGps.longitude.toFixed(4)}</span>
          </div>
          {discrepancyKm && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isGpsSpoofed ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' : 'bg-zinc-900 text-zinc-300 border-white/10'}`}>
              Distancia a Captura: {discrepancyKm} km
            </span>
          )}
        </div>
      )}

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
