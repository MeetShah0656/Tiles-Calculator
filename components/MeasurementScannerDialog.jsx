import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Trash2, 
  Plus, 
  Check, 
  RotateCcw, 
  AlertTriangle,
  Info,
  Edit2,
  Sparkles,
  Lock
} from 'lucide-react';
import { scanMeasurementsWithBackend } from '@/lib/scanner/gemini.js';
import { useJobStore } from '@/store/store.js';
import UpgradeProModal from '@/components/UpgradeProModal.jsx';

const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export default function MeasurementScannerDialog({ 
  tileId, 
  onClose, 
  onImportMeasurements 
}) {
  const subscription = useJobStore((state) => state.subscription);
  const isPro = subscription?.isPro || false;

  const [step, setStep] = useState('select'); // 'select' | 'analyzing' | 'verify'
  const [imagePreview, setImagePreview] = useState(null);
  const [scannedRooms, setScannedRooms] = useState([]);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [rawTotalScanned, setRawTotalScanned] = useState(0);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setStep('analyzing');
    setError(null);

    try {
      const blob = dataURLtoBlob(imagePreview);
      const response = await scanMeasurementsWithBackend(blob, 'image/jpeg');
      const rooms = Array.isArray(response) ? response : (response?.rooms || []);

      if (!rooms || rooms.length === 0) {
        throw new Error("No readable measurement lines detected in image.");
      }

      setRawTotalScanned(rooms.length);

      if (!isPro && rooms.length > 5) {
        setScannedRooms(rooms.slice(0, 5));
      } else {
        setScannedRooms(rooms);
      }

      setStep('verify');
    } catch (err) {
      console.error("Scanning error:", err);
      setError(err.message || "Failed to parse handwritten note. Please make sure the handwriting is clear.");
      setStep('select');
    }
  };

  const handleRoomChange = (index, field, value) => {
    setScannedRooms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddRow = () => {
    if (!isPro && scannedRooms.length >= 5) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setScannedRooms((prev) => [
      ...prev,
      {
        name: `Item ${prev.length + 1}`,
        length: 24,
        width: 24,
        quantity: 1,
        confidence: 100
      }
    ]);
  };

  const handleDeleteRow = (index) => {
    setScannedRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    onImportMeasurements(scannedRooms);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
        <div className="bg-[#f4f2ee] border border-[#d4d1ca] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-[#d4d1ca] bg-[#e8e6e1]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-black text-[#6b6863] tracking-[0.25em]">Measurement Sheet Scanner</span>
                {!isPro && (
                  <span className="px-2 py-0.5 bg-[#0a0a0a] text-white text-[9px] font-black uppercase tracking-wider">
                    Free Plan (5 items cap)
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-[#0a0a0a] tracking-wider uppercase mt-0.5">Scan Paper Notes</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-[#6b6863] hover:text-[#0a0a0a] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 flex-grow overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 bg-[#0a0a0a] text-white text-xs font-bold uppercase tracking-wider border border-black flex items-start space-x-2">
                <AlertTriangle size={16} className="text-white mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 'select' && (
              <div className="space-y-4">
                {!imagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                      isDragOver 
                        ? 'border-[#0a0a0a] bg-[#e8e6e1]' 
                        : 'border-[#d4d1ca] hover:border-[#0a0a0a] bg-[#f4f2ee]'
                    }`}
                  >
                    <Upload size={36} className="mx-auto stroke-1 text-[#0a0a0a] mb-2" />
                    <p className="text-xs font-black text-[#0a0a0a] uppercase tracking-wider">
                      Click to select or drag & drop handwritten measurement note
                    </p>
                    <p className="text-[10px] text-[#6b6863] uppercase font-bold mt-1 tracking-wider">Supports PNG, JPG, WEBP formats up to 10MB</p>
                    
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                    <input 
                      ref={cameraInputRef} 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </div>
                ) : (
                  <div className="relative border border-[#d4d1ca] overflow-hidden max-h-[260px] bg-[#0a0a0a] flex justify-center items-center">
                    <img src={imagePreview} alt="Scanned note preview" className="max-h-[260px] object-contain" />
                    <button 
                      onClick={() => setImagePreview(null)} 
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white rounded-full transition-all cursor-pointer border border-zinc-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-4 py-2.5 border border-[#0a0a0a] bg-white hover:bg-[#e8e6e1] text-xs font-black text-[#0a0a0a] cursor-pointer uppercase tracking-wider"
                  >
                    <Camera size={14} className="text-[#0a0a0a]" />
                    <span>Take Photo with Camera</span>
                  </button>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      className="flex items-center space-x-1.5 px-6 py-2.5 bg-[#0a0a0a] hover:bg-neutral-800 text-white font-black text-xs shadow-md cursor-pointer border border-black uppercase tracking-[0.2em]"
                    >
                      <span>Extract Measurements</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 'analyzing' && (
              <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#0a0a0a] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-[#0a0a0a] uppercase tracking-[0.25em]">Analyzing Note...</p>
                <p className="text-[10px] text-[#6b6863] font-bold uppercase tracking-widest">Reading handwritten dimensions, room labels, and quantities.</p>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                {!isPro && rawTotalScanned > 5 && (
                  <div className="p-4 bg-[#0a0a0a] text-white flex items-center justify-between border border-black">
                    <div className="flex items-center space-x-2 text-xs font-bold">
                      <Lock size={16} className="text-white" />
                      <span className="uppercase tracking-wider">Free Plan: Extracted 5 of {rawTotalScanned} items.</span>
                    </div>
                    <button
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="px-4 py-1.5 bg-white text-[#0a0a0a] text-[10px] font-black uppercase hover:bg-neutral-200 cursor-pointer tracking-widest"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-[#0a0a0a] uppercase tracking-wider">Extracted Measurements</span>
                    <span className="px-2.5 py-0.5 bg-[#0a0a0a] text-white text-[10px] font-black">
                      {scannedRooms.length} items
                    </span>
                  </div>
                  <button
                    onClick={() => setStep('select')}
                    className="flex items-center space-x-1 text-xs font-bold text-[#6b6863] hover:text-[#0a0a0a] cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw size={14} />
                    <span>Rescan Sheet</span>
                  </button>
                </div>

                {/* Table of Scanned Items */}
                <div className="overflow-x-auto border border-[#d4d1ca] bg-white">
                  <table className="w-full text-left text-xs divide-y divide-[#d4d1ca]">
                    <thead className="bg-[#e8e6e1] font-black text-[#6b6863] uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Location Name</th>
                        <th className="p-3 text-center">Length (in)</th>
                        <th className="p-3 text-center">Width (in)</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4d1ca] font-semibold text-[#0a0a0a]">
                      {scannedRooms.map((room, idx) => (
                        <tr key={idx} className="hover:bg-[#f4f2ee]">
                          <td className="p-2">
                            <input
                              type="text"
                              value={room.name}
                              onChange={(e) => handleRoomChange(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1.5 border border-[#d4d1ca] font-bold text-xs bg-white outline-none focus:border-[#0a0a0a]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={room.length}
                              onChange={(e) => handleRoomChange(idx, 'length', e.target.value)}
                              className="w-16 text-center px-1 py-1.5 border border-[#d4d1ca] font-bold text-xs bg-white outline-none focus:border-[#0a0a0a]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={room.width}
                              onChange={(e) => handleRoomChange(idx, 'width', e.target.value)}
                              className="w-16 text-center px-1 py-1.5 border border-[#d4d1ca] font-bold text-xs bg-white outline-none focus:border-[#0a0a0a]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={room.quantity}
                              onChange={(e) => handleRoomChange(idx, 'quantity', e.target.value)}
                              className="w-14 text-center px-1 py-1.5 border border-[#d4d1ca] font-bold text-xs bg-white outline-none focus:border-[#0a0a0a]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-[#6b6863] hover:text-[#0a0a0a] cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#d4d1ca]">
                  <button
                    onClick={handleAddRow}
                    className="flex items-center space-x-1 text-xs font-black text-[#0a0a0a] hover:underline cursor-pointer uppercase tracking-wider"
                  >
                    <Plus size={14} />
                    <span>Add Manual Line</span>
                  </button>

                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 border border-[#d4d1ca] bg-white text-xs font-black text-[#6b6863] hover:text-[#0a0a0a] cursor-pointer uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="flex items-center space-x-1.5 px-6 py-2.5 bg-[#0a0a0a] text-white text-xs font-black uppercase hover:bg-neutral-800 cursor-pointer shadow-md tracking-[0.2em] border border-black"
                    >
                      <Check size={14} />
                      <span>Import Scanned Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
