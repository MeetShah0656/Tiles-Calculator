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
  Edit2
} from 'lucide-react';
import { scanMeasurementsWithBackend } from '@/lib/scanner/gemini.js';

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
  onImport 
}) {
  const [step, setStep] = useState('select');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [scannedRooms, setScannedRooms] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processImageFile = (file) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError("Invalid file type. Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 2000;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(compressed);
        } else {
          setImagePreview(e.target?.result);
        }
      };
      img.onerror = () => {
        setError("Failed to load image file. It may be corrupted.");
      };
      img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
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

      setScannedRooms(rooms);
      setStep('verify');
    } catch (err) {
      console.error("AI Scanning error:", err);
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

  const handleDeleteRoom = (index) => {
    setScannedRooms((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddRoom = () => {
    setScannedRooms((prev) => [
      ...prev,
      { name: 'Room Space', length: 120, width: 96, unit: 'in', quantity: 1, confidence: 100 }
    ]);
  };

  const handleImportSubmit = () => {
    onImport(scannedRooms);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-sm border border-zinc-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/70">
          <div>
            <span className="text-[10px] uppercase font-black text-zinc-950 tracking-widest">AI Measurement Sheet Scanner</span>
            <h2 className="text-base font-black text-zinc-950">Scan Paper Notes</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-800 rounded-sm cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-grow overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-zinc-950 text-white rounded-sm text-xs font-semibold flex items-start space-x-2 border border-zinc-800">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
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
                  className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
                    isDragOver 
                      ? 'border-zinc-950 bg-zinc-100' 
                      : 'border-zinc-300 hover:border-zinc-950 bg-zinc-50/50'
                  }`}
                >
                  <Upload size={36} className="mx-auto stroke-1 text-zinc-600 mb-2" />
                  <p className="text-xs font-bold text-zinc-950">
                    Click to select or drag & drop handwritten measurement note
                  </p>
                  <p className="text-3xs text-zinc-500 mt-1">Supports PNG, JPG, WEBP formats up to 10MB</p>
                  
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
                <div className="relative rounded-sm border border-zinc-200 overflow-hidden max-h-[260px] bg-zinc-950 flex justify-center items-center">
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
                  className="flex items-center space-x-1.5 px-3 py-2 border border-zinc-300 hover:bg-zinc-100 rounded-sm text-xs font-bold text-zinc-950 cursor-pointer"
                >
                  <Camera size={14} className="text-zinc-950" />
                  <span>Take Photo with Camera</span>
                </button>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-zinc-950 hover:bg-black text-white font-bold rounded-sm text-xs shadow-md cursor-pointer border border-zinc-800 uppercase tracking-wider"
                  >
                    <span>Extract Measurements</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-black text-zinc-950 uppercase tracking-wider">Analyzing Note with Gemini AI...</p>
              <p className="text-3xs text-zinc-500">Reading handwritten dimensions, room labels, and quantities.</p>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-zinc-950 uppercase tracking-wider border-l-2 border-zinc-950 pl-2">
                  Verify Extracted Measurements ({scannedRooms.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="flex items-center space-x-1 text-2xs font-extrabold text-zinc-950 hover:underline cursor-pointer uppercase tracking-wider"
                >
                  <Plus size={12} />
                  <span>Add Extra Item</span>
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-150 border border-zinc-200 rounded-sm">
                {(Array.isArray(scannedRooms) ? scannedRooms : []).map((room, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-3xs font-extrabold text-zinc-450 uppercase mb-0.5">Location</label>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleRoomChange(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-extrabold text-zinc-450 uppercase mb-0.5">Length (in)</label>
                        <input
                          type="number"
                          value={room.length}
                          onChange={(e) => handleRoomChange(idx, 'length', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-extrabold text-zinc-450 uppercase mb-0.5">Width (in)</label>
                        <input
                          type="number"
                          value={room.width}
                          onChange={(e) => handleRoomChange(idx, 'width', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-extrabold text-zinc-450 uppercase mb-0.5">Qty</label>
                        <input
                          type="number"
                          value={room.quantity}
                          onChange={(e) => handleRoomChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRoom(idx)}
                      className="p-1.5 text-zinc-400 hover:text-black rounded-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="flex items-center space-x-1 text-2xs font-extrabold text-zinc-500 hover:text-zinc-950 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Rescan Different Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-zinc-950 hover:bg-black text-white font-bold rounded-sm text-xs shadow-md cursor-pointer border border-zinc-800 uppercase tracking-wider"
                >
                  <Check size={14} />
                  <span>Import into Calculator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
