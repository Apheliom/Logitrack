import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Generador de Tono Sintetizado Pericial (Web Audio API nativa sin dependencias)
 * Emite un 'Ping' acústico de radar de alta frecuencia (880 Hz -> 1760 Hz)
 */
export function playPeritajeRadarSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn('Audio alert blocked:', e);
  }
}

/**
 * Contexto Central de Coordinación Pericial de SecuriTrace
 * Implementa el patrón "state-decouple-implementation"
 */
const ForensicContext = createContext(null);

export function ForensicProvider({ children }) {
  const [activeTab, setActiveTab] = useState('file-analysis');
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estado de análisis
  const [fileAnalysisResult, setFileAnalysisResult] = useState(null);
  const [audioAnalysisResult, setAudioAnalysisResult] = useState(null);
  const [operator, setOperator] = useState('Perito_Sistemas_Maicol');

  // Notificador de actualización de auditoría
  const notifyEvidenceSaved = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Mapeo del agente especializado activo según el módulo
  const activeAgent = useMemo(() => {
    switch (activeTab) {
      case 'file-analysis':
        return {
          id: 'agent-vision',
          name: 'Agent-VisionForensics',
          role: 'Especialista en Cabeceras Binarias, EXIF, C2PA, SynthID e IA Generativa',
          status: 'STANDBY_READY',
          badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40'
        };
      case 'audio-analysis':
        return {
          id: 'agent-audio',
          name: 'Agent-AcousticVoice',
          role: 'Especialista en Análisis Espectral FFT 60 FPS, Vocoders y Deepfakes Vocales',
          status: 'STANDBY_READY',
          badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/40'
        };
      case 'audit-logs':
        return {
          id: 'agent-custody',
          name: 'Agent-ChainOfCustody',
          role: 'Garante de Inmutabilidad SHA-256, SQLite ACID y Trazabilidad Pericial',
          status: 'STANDBY_READY',
          badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40'
        };
      default:
        return {
          id: 'agent-system',
          name: 'Agent-SystemArchitecture',
          role: 'Especialista en Metodología y Puesta en Marcha de Implantación',
          status: 'STANDBY_READY',
          badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40'
        };
    }
  }, [activeTab]);

  const value = useMemo(() => ({
    activeTab,
    setActiveTab,
    guideModalOpen,
    setGuideModalOpen,
    refreshTrigger,
    notifyEvidenceSaved,
    fileAnalysisResult,
    setFileAnalysisResult,
    audioAnalysisResult,
    setAudioAnalysisResult,
    operator,
    setOperator,
    activeAgent
  }), [
    activeTab,
    guideModalOpen,
    refreshTrigger,
    notifyEvidenceSaved,
    fileAnalysisResult,
    audioAnalysisResult,
    operator,
    activeAgent
  ]);

  return (
    <ForensicContext.Provider value={value}>
      {children}
    </ForensicContext.Provider>
  );
}

export function useForensic() {
  const context = useContext(ForensicContext);
  if (!context) {
    throw new Error('useForensic debe usarse dentro de un ForensicProvider');
  }
  return context;
}
