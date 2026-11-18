import React from 'react';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import FileAnalyzer from './components/FileAnalyzer';
import AudioAnalyzer from './components/AudioAnalyzer';
import AuditDashboard from './components/AuditDashboard';
import ImplementationSpecs from './components/ImplementationSpecs';
import DefenseGuideModal from './components/DefenseGuideModal';
import { ForensicProvider, useForensic } from './context/ForensicContext';

function ForensicWorkbenchContent() {
  const { activeTab, guideModalOpen, setGuideModalOpen } = useForensic();

  return (
    <div className="min-h-screen bg-obsidian-950 text-zinc-100 flex flex-col font-sans v0-grid-bg antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Floating Command Bar */}
      <Navbar />

      {/* Panoramic Workspace (con padding inferior para bottom bar móvil) */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-10">
        {activeTab === 'file-analysis' && <FileAnalyzer />}
        {activeTab === 'audio-analysis' && <AudioAnalyzer />}
        {activeTab === 'audit-logs' && <AuditDashboard />}
        {activeTab === 'implementation-specs' && <ImplementationSpecs />}
      </main>

      {/* Dock Táctil Inferior para Dispositivos Móviles */}
      <MobileBottomNav />

      {/* Modal de Procedimientos y Manual Operativo */}
      <DefenseGuideModal 
        isOpen={guideModalOpen} 
        onClose={() => setGuideModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ForensicProvider>
      <ForensicWorkbenchContent />
    </ForensicProvider>
  );
}
