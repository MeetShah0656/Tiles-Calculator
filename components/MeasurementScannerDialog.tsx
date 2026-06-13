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
import { ScannedRoom } from '@/lib/scanner/types';

interface MeasurementScannerDialogProps {
  tileId: string;
  onClose: () => void;
  onImport: (rooms: ScannedRoom[]) => void;
}

export default function MeasurementScannerDialog({ 
  tileId, 
  onClose, 
  onImport 
}: MeasurementScannerDialogProps) {
  const [step, setStep] = useState<'select' | 'analyzing' | 'verify'>('select');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannedRooms, setScannedRooms] = useState<ScannedRoom[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Compress/resize image and convert to JPEG
  const processImageFile = (file: File) => {
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
          setImagePreview(e.target?.result as string);
        }
      };
      img.onerror = () => {
        setError("Failed to load image file. It may be corrupted.");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Triggers API Call to backend
  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setStep('analyzing');
    setError(null);

    try {
      const response = await fetch('/api/scan-measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imagePreview })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to scan measurements.");
      }

      if (!data.rooms || data.rooms.length === 0) {
        throw new Error("No measurements detected in the image. Please make sure the writing is clear.");
      }

      setScannedRooms(data.rooms);
      setStep('verify');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while connecting to the analyzer.");
      setStep('select');
    }
  };

  // Edit fields inside verification table
  const handleRoomChange = (index: number, field: keyof ScannedRoom, value: any) => {
    setScannedRooms(prev => prev.map((room, idx) => {
      if (idx !== index) return room;
      
      const updated = { ...room };
      if (field === 'name') updated.name = String(value);
      if (field === 'length') updated.length = Number(value) || 0;
      if (field === 'width') updated.width = Number(value) || 0;
      if (field === 'unit') updated.unit = String(value);
      
      // If user edits fields, we set confidence back to high since it was verified
      updated.confidence = 100;
      return updated;
    }));
  };

  const handleAddRow = () => {
    setScannedRooms(prev => [
      ...prev,
      { name: "New Space", length: 0, width: 0, unit: "ft", confidence: 100 }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setScannedRooms(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImportClick = () => {
    if (scannedRooms.length === 0) {
      alert("No measurements available to import.");
      return;
    }
    onImport(scannedRooms);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-100 text-emerald-800">
          High Legibility
        </span>
      );
    } else if (confidence >= 70) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-amber-100 text-amber-800">
          Moderate
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse border border-rose-200">
          <AlertTriangle size={10} className="mr-1" />
          ⚠ Verify this measurement
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white border border-slate-200 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl p-4 sm:p-6 animate-scaleUp cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-3 flex-shrink-0">
          <div>
            <span className="text-[10px] uppercase font-black text-primary tracking-wider">AI Vision Extraction</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">Measurements Scanner</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Prioritizes high accuracy. Convert handwritten sheets instantly.</p>
          </div>
          {step !== 'analyzing' && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-sm transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="flex-grow overflow-y-auto my-3 pr-1">
          {error && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-sm flex items-start space-x-2 text-xs text-rose-700">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={14} />
              <div className="flex-1">
                <span className="font-bold">Error Processing: </span>
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 font-bold">Dismiss</button>
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-4">
              {/* Image Preview / Drag Area */}
              {!imagePreview ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-sm p-8 text-center flex flex-col items-center justify-center space-y-3 transition-all ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Drag & drop your sheet photo here</p>
                    <p className="text-xs text-slate-400 mt-0.5">Supported formats: JPG, PNG, WEBP (Max 10MB)</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-sm text-xs shadow-sm cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Upload File</span>
                    </button>
                    
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold px-4 py-2 rounded-sm text-xs border border-slate-200 shadow-xs cursor-pointer"
                    >
                      <Camera size={14} className="text-primary" />
                      <span>Take Photo</span>
                    </button>
                  </div>

                  {/* Hidden inputs */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative border border-slate-200 rounded-sm overflow-hidden bg-slate-50 flex items-center justify-center max-h-[300px]">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded measurement sheet" 
                      className="max-h-[300px] object-contain"
                    />
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full shadow-lg transition-all cursor-pointer"
                      title="Remove Image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setError(null);
                      }}
                      className="px-4 py-2.5 rounded-sm border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Replace Image
                    </button>
                    
                    <button
                      onClick={handleAnalyze}
                      className="flex items-center space-x-1.5 bg-primary hover:opacity-90 text-white font-bold px-6 py-2.5 rounded-sm text-xs shadow-md transition-all cursor-pointer"
                    >
                      <span>Analyze Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'analyzing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Analyzing handwritten measurements...</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">Gemini is parsing rows, rooms, widths, and lengths. This feature prioritizes accuracy over speed, please hold on.</p>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-2.5 rounded-sm text-2xs text-slate-500">
                <Info size={14} className="text-primary flex-shrink-0" />
                <span>Please verify measurements below. Touch/click inputs to correct errors before importing.</span>
              </div>

              {/* Responsive Verification Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-sm">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-2.5 w-1/3">Space / Room Name</th>
                      <th className="p-2.5 text-center w-20">Length</th>
                      <th className="p-2.5 text-center w-20">Width</th>
                      <th className="p-2.5 text-center w-20">Unit</th>
                      <th className="p-2.5 text-center">Legibility</th>
                      <th className="p-2.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {scannedRooms.map((room, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        {/* Room Name Input */}
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={room.name}
                            onChange={(e) => handleRoomChange(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-800 font-bold text-xs"
                          />
                        </td>
                        
                        {/* Length Input */}
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={room.length || ''}
                            onChange={(e) => handleRoomChange(idx, 'length', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-800 font-bold text-xs text-center"
                            placeholder="0"
                          />
                        </td>

                        {/* Width Input */}
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={room.width || ''}
                            onChange={(e) => handleRoomChange(idx, 'width', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-800 font-bold text-xs text-center"
                            placeholder="0"
                          />
                        </td>

                        {/* Unit Selection */}
                        <td className="p-2">
                          <select
                            value={room.unit}
                            onChange={(e) => handleRoomChange(idx, 'unit', e.target.value)}
                            className="w-full px-1.5 py-1.5 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-800 font-bold text-xs text-center outline-none bg-white"
                          >
                            <option value="in">Inches (in)</option>
                            <option value="ft">Feet (ft)</option>
                          </select>
                        </td>

                        {/* Confidence Indicator */}
                        <td className="p-2 text-center whitespace-nowrap">
                          {getConfidenceBadge(room.confidence)}
                        </td>

                        {/* Delete Row Button */}
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-sm hover:bg-slate-100 transition-all cursor-pointer"
                            title="Remove measurement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Verification Controls */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleAddRow}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Room Row</span>
                </button>

                <button
                  onClick={() => {
                    setStep('select');
                    setScannedRooms([]);
                  }}
                  className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Re-scan Image</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 flex-shrink-0 gap-3">
          {step === 'verify' ? (
            <>
              <button 
                onClick={() => {
                  setStep('select');
                  setScannedRooms([]);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-sm text-xs cursor-pointer shadow-sm"
              >
                Back / Cancel
              </button>
              <button 
                onClick={handleImportClick}
                className="bg-primary hover:opacity-90 text-white font-bold px-6 py-2.5 rounded-sm text-xs flex items-center space-x-1 shadow-md cursor-pointer"
              >
                <Check size={14} />
                <span>Import to Calculator</span>
              </button>
            </>
          ) : (
            <>
              <div className="text-2xs text-slate-450 italic hidden sm:block">
                All uploaded files are optimized and never saved permanently.
              </div>
              <button 
                onClick={onClose}
                disabled={step === 'analyzing'}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-sm text-xs cursor-pointer shadow-md transition-all w-full sm:w-auto text-center"
              >
                Cancel / Close
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
