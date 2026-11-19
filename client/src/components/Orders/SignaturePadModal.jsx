import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool } from 'lucide-react';

export const SignaturePadModal = ({ isOpen, onClose, onSave, order }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1e293b'; // Slate 800 dark ink
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    if (!hasDrawn) {
      alert('Por favor solicite la firma del receptor antes de confirmar.');
      return;
    }
    const canvas = canvasRef.current;
    const signatureBase64 = canvas.toDataURL('image/png');
    onSave(signatureBase64);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900 font-bold text-base">Firma Digital de Entrega</h3>
            <span className="text-xs text-slate-500 font-mono">Guía: {order.tracking_number}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-6">
          <p className="text-xs text-slate-600 mb-2">
            Receptor autorizado: <strong className="text-slate-900">{order.client_name}</strong>
          </p>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/70 overflow-hidden relative cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={380}
              height={180}
              className="w-full h-[180px] touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs select-none gap-1">
                <PenTool className="w-5 h-5 text-slate-300" />
                <span>Firme aquí con el dedo o puntero táctil</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar trazo</span>
            </button>
            <span className="text-[11px] text-slate-400">Validez legal POD</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Entrega</span>
          </button>
        </div>

      </div>
    </div>
  );
};
