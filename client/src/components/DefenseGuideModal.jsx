import React, { useState } from 'react';
import { BookOpen, X, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Terminal } from 'lucide-react';

export default function DefenseGuideModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('script');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-obsidian-950/95 border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-obsidian-900/40">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono">
                  MANUAL OPERATIVO Y PROCEDIMIENTOS FORENSES (SOP)
                </h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700/50">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Protocolo estándar de operación y demostración ejecutiva de capacidades de SecuriTrace.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] px-6 bg-obsidian-900/20 text-xs font-mono">
          <button
            onClick={() => setActiveSection('script')}
            className={`py-3.5 px-4 border-b-2 font-semibold transition-all flex items-center space-x-2 ${
              activeSection === 'script'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>1. Demostración Operativa en Vivo</span>
          </button>

          <button
            onClick={() => setActiveSection('architecture')}
            className={`py-3.5 px-4 border-b-2 font-semibold transition-all flex items-center space-x-2 ${
              activeSection === 'architecture'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Arquitectura de Seguridad</span>
          </button>

          <button
            onClick={() => setActiveSection('faq')}
            className={`py-3.5 px-4 border-b-2 font-semibold transition-all flex items-center space-x-2 ${
              activeSection === 'faq'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>3. Criterios de Auditoría Técnica</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-300 text-xs leading-relaxed font-sans">
          {activeSection === 'script' && (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-2.5">
                <div className="flex items-center space-x-2 font-mono text-cyan-400 font-bold">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px] shadow-sm">
                    1
                  </span>
                  <span className="text-sm">PRESENTACIÓN Y ALCANCE FORENSE (1 MINUTO)</span>
                </div>
                <p className="italic text-zinc-300 bg-obsidian-950 p-4 rounded-xl border-l-2 border-cyan-400 font-mono leading-relaxed">
                  "Presentamos <strong>SecuriTrace</strong>, una plataforma de grado pericial diseñada para neutralizar una de las mayores vulnerabilidades en la implantación de procesos digitales modernos: la <strong>suplantación de identidad mediante manipulación de documentos y clonación de voz por Inteligencia Artificial (Deepfakes)</strong>. A diferencia de soluciones teóricas, SecuriTrace opera en tiempo real bajo estrictos estándares forenses de cadena de custodia ISO/IEC 27037."
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-2.5">
                <div className="flex items-center space-x-2 font-mono text-cyan-400 font-bold">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px] shadow-sm">
                    2
                  </span>
                  <span className="text-sm">DEMOSTRACIÓN MÓDULO A: ANÁLISIS EXIF Y PROCEDENCIA IA</span>
                </div>
                <p className="text-zinc-300">
                  Usa los casos de prueba rápida <strong className="text-sky-400">"Caso Gemini / Imagen"</strong> o <strong className="text-rose-400">"Caso Photoshop"</strong>, o transmite una evidencia desde el teléfono mediante el código QR.
                </p>
                <p className="italic text-zinc-300 bg-obsidian-950 p-4 rounded-xl border-l-2 border-rose-500 font-mono leading-relaxed">
                  "Observen cómo el motor backend en Node.js recibe el buffer directamente en memoria volátil (RAM) sin almacenar copias no cifradas en disco, respetando la privacidad forense. Inmediatamente calculamos el hash criptográfico <strong>SHA-256</strong> y el <strong>pHash visual</strong> garantizando la integridad inmutable. Al analizar la estructura interna, el sistema identifica si la imagen proviene de modelos generativos como Gemini (Imagen 3), firmas de Photoshop, incongruencias de fechas o marcas de agua SynthID/C2PA, emitiendo veredicto y desplegando la <strong>Línea de Tiempo de Procedencia Virtual y Geolocalización</strong>."
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-2.5">
                <div className="flex items-center space-x-2 font-mono text-cyan-400 font-bold">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px] shadow-sm">
                    3
                  </span>
                  <span className="text-sm">DEMOSTRACIÓN MÓDULO B: ESPECTROGRAMA Y VOZ EN VIVO</span>
                </div>
                <p className="text-zinc-300">
                  Pasa al Módulo B, pulsa <strong className="text-cyan-400">"Grabar Micrófono"</strong> o usa <strong className="text-rose-400">"Simular Deepfake (IA)"</strong>.
                </p>
                <p className="italic text-zinc-300 bg-obsidian-950 p-4 rounded-xl border-l-2 border-cyan-400 font-mono leading-relaxed">
                  "Para la autenticación biométrica de voz, implementamos la <strong>Web Audio API con Canvas 2D a 60 FPS</strong> ejecutando una Transformada Rápida de Fourier (FFT). Cuando habla una persona real, las frecuencias exhiben resonancias armónicas orgánicas. En cambio, cuando evaluamos una voz sintética por IA (Deepfake), detectamos un corte abrupto por encima de los <strong>8 kHz</strong> típico de los vocoders neuronales. El sistema dictamina <strong>Voz Sintética Deepfake</strong> y calcula el índice de autenticidad biométrica."
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-2.5">
                <div className="flex items-center space-x-2 font-mono text-cyan-400 font-bold">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px] shadow-sm">
                    4
                  </span>
                  <span className="text-sm">DEMOSTRACIÓN MÓDULO C: AUDITORÍA Y CIERRE</span>
                </div>
                <p className="text-zinc-300">
                  Pasa al Módulo C, muestra la tabla de auditoría, pulsa <strong className="text-cyan-300">"Exportar JSON"</strong> y abre el <strong className="text-amber-400">"Dictamen Pericial Criptográfico"</strong>.
                </p>
                <p className="italic text-zinc-300 bg-obsidian-950 p-4 rounded-xl border-l-2 border-emerald-400 font-mono leading-relaxed">
                  "En el marco de la implantación de sistemas críticos, un software solo es viable si asegura <strong>trazabilidad y auditoría forense inmutable</strong>. Cada análisis queda registrado en una cadena criptográfica Merkle en SQLite. El auditor puede generar en un clic el reporte ejecutivo en JSON o el dictamen pericial firmado bajo ISO/IEC 27037 con sellos HMAC-SHA256."
                </p>
              </div>
            </div>
          )}

          {activeSection === 'architecture' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-3">
                <h4 className="text-cyan-400 font-bold text-sm">JUSTIFICACIÓN TÉCNICA DE IMPLANTACIÓN</h4>
                <ul className="space-y-2.5 pt-1 list-disc list-inside text-zinc-300">
                  <li><strong>Volatilidad de la Evidencia:</strong> Uso de buffers en memoria RAM con Multer para evitar que artefactos sensibles queden en disco sin cifrar.</li>
                  <li><strong>Integridad Criptográfica (Cadena de Custodia):</strong> Empleo del estándar FIPS 180-4 mediante el módulo nativo <code>crypto</code> generando hashes SHA-256 inmutables y cadena Merkle secuencial.</li>
                  <li><strong>Interoperabilidad & Ligereza:</strong> Base de datos SQLite relacional embebida (cero dependencias externas para despliegue on-premise en estaciones periciales desconectadas).</li>
                  <li><strong>Visualización en Tiempo Real:</strong> Web Audio API + HTML5 Canvas alcanzando 60 FPS sin saturar el backend.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-1">
                <p className="text-cyan-300 font-bold">¿Por qué calcular el SHA-256 inmediatamente?</p>
                <p className="text-zinc-400">
                  Para cumplir con la <strong>Cadena de Custodia</strong>. Si un archivo es presentado como prueba pericial, su hash debe ser idéntico antes y después para garantizar que la plataforma no alteró ni un solo byte del archivo.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-1">
                <p className="text-cyan-300 font-bold">¿Cómo detecta la plataforma que una imagen fue creada por Gemini u otra IA?</p>
                <p className="text-zinc-400">
                  Mediante un motor multinivel: inspección de etiquetas estándar IPTC (<code>trainedAlgorithmicMedia</code>), detección de marcas de agua espectrales SynthID/C2PA, análisis de nombres de exportación y detección de <strong>Metadata Stripping Severo</strong> (ausencia de parámetros ópticos de sensor).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-1">
                <p className="text-cyan-300 font-bold">¿Por qué un Deepfake de voz presenta cortes en altas frecuencias?</p>
                <p className="text-zinc-400">
                  Los modelos acústicos neuronales entrenan sobre datasets con muestreos a 16 kHz o 24 kHz (Nyquist a 8 kHz o 12 kHz). Carecen de los armónicos superiores orgánicos y continuos de la cavidad buconasal humana real.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/[0.08] bg-obsidian-950/80 flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-500">SecuriTrace Core Enterprise • Sistema de Análisis Forense</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md shadow-cyan-600/30"
          >
            Entendido, volver a la consola
          </button>
        </div>
      </div>
    </div>
  );
}
