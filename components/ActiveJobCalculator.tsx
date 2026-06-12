'use client';

import { useJobStore, MeasurementRow, TileGroup } from '@/store/store';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Printer, 
  Share2, 
  Info,
  User,
  Coins,
  ChevronDown,
  ChevronUp,
  Grid
} from 'lucide-react';
import { useState } from 'react';

export default function ActiveJobCalculator() {
  const { 
    activeJob, 
    updateActiveJobDetails, 
    addTile,
    updateTile,
    deleteTile,
    addRowToTile,
    updateTileRow,
    duplicateRowInTile,
    deleteRowFromTile,
    saveJob,
    isOnline
  } = useJobStore();

  const [notification, setNotification] = useState('');
  const [collapsedTiles, setCollapsedTiles] = useState<Record<string, boolean>>({});

  const handleSave = () => {
    if (!activeJob.customerName || !activeJob.projectName) {
      alert('Please fill in Customer Name and Project Name before saving.');
      return;
    }
    saveJob();
    setNotification('Job saved successfully! Check Job History.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handlePrint = () => { window.print(); };

  const toggleTileCollapse = (tileId: string) => {
    setCollapsedTiles(prev => ({
      ...prev,
      [tileId]: !prev[tileId]
    }));
  };

  const getWhatsAppText = () => {
    const lines = [
      `*Yash Marble Calculation Summary*`,
      `========================`,
      `*Customer:* ${activeJob.customerName || 'N/A'}`,
      `*Project:* ${activeJob.projectName || 'N/A'}`,
      `*Address:* ${activeJob.siteAddress || 'N/A'}`,
      `*Total Area:* ${activeJob.totalArea.toFixed(2)} sq ft`,
      `*Grand Total:* ₹${activeJob.grandTotal.toLocaleString('en-IN')}`,
      `========================`
    ];

    activeJob.tiles.forEach((tile, idx) => {
      lines.push(
        `\n*Tile ${idx + 1}: ${tile.tileName || 'Unnamed Tile'}*`,
        `*Rate:* ₹${tile.ratePerSqft}/sq ft`,
        `*Subtotal:* ${tile.totalArea.toFixed(2)} sq ft | ₹${tile.subtotal.toLocaleString('en-IN')}`,
        `*Measurements:*`
      );
      tile.rows.forEach((row, rIdx) => {
        if (row.lengthInches && row.widthInches) {
          const locStr = row.location ? `[${row.location}] ` : '';
          lines.push(`  ${rIdx + 1}. ${locStr}${row.lengthInches}" x ${row.widthInches}" | Qty: ${row.quantity} -> ${row.totalArea.toFixed(2)} sq ft`);
        }
      });
    });

    return encodeURIComponent(lines.join('\n'));
  };

  const handleWhatsAppShare = async () => {
    try {
      setNotification('Generating PDF Estimate...');
      
      const element = document.getElementById('printable-invoice');
      if (!element) {
        throw new Error('Printable layout element not found. Please ensure the page is fully loaded.');
      }
      
      // Dynamic imports to optimize bundle size and prevent SSR issues
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      
      // Save original styling
      const originalStyle = element.getAttribute('style') || '';
      
      // Force it to be visible for capture, but place it off-screen
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.width = '800px';
      
      // Let html2canvas render it
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Restore styling
      element.setAttribute('style', originalStyle);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const filename = `${activeJob.customerName || 'Estimate'}_calculation.pdf`.replace(/[^a-zA-Z0-9_\-]/g, '_');
      
      const shareData = {
        files: [
          new File([pdfBlob], filename, {
            type: 'application/pdf',
          })
        ],
        title: 'Tiles Calculation Estimate',
        text: `Tiles calculation estimate for ${activeJob.projectName || 'your project'}.`
      };
      
      if (navigator.canShare && navigator.canShare(shareData)) {
        setNotification('Opening share menu...');
        await navigator.share(shareData);
        setNotification('Estimate shared successfully!');
        setTimeout(() => setNotification(''), 3000);
      } else {
        // Fallback: Download PDF and open WhatsApp web text link
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        setNotification('PDF downloaded! Opening WhatsApp to share summary...');
        
        const text = getWhatsAppText();
        const phone = activeJob.phoneNumber ? activeJob.phoneNumber.replace(/[^0-9]/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        
        setTimeout(() => setNotification(''), 5000);
      }
    } catch (err: any) {
      console.error('Failed to share PDF:', err);
      // Don't show abort error (when user cancels native share sheet) as a failure
      if (err.name !== 'AbortError') {
        setNotification(`Failed to share PDF: ${err.message || err}`);
        setTimeout(() => setNotification(''), 5000);
      } else {
        setNotification('');
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-36 md:pb-16">
      {/* Save Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-sm bg-primary text-white shadow-xl flex items-center space-x-2 animate-bounce max-w-[90vw]">
          <Info size={16} />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Customer Info Card */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <User className="text-primary" size={18} />
          <span>Job Details</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text" required value={activeJob.customerName}
              onChange={(e) => updateActiveJobDetails({ customerName: e.target.value })}
              placeholder="e.g. ABC Builders"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
            <input
              type="tel" value={activeJob.phoneNumber}
              onChange={(e) => updateActiveJobDetails({ phoneNumber: e.target.value })}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text" required value={activeJob.projectName}
              onChange={(e) => updateActiveJobDetails({ projectName: e.target.value })}
              placeholder="e.g. Ground Floor Kitchen"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Site Address</label>
            <input
              type="text" value={activeJob.siteAddress}
              onChange={(e) => updateActiveJobDetails({ siteAddress: e.target.value })}
              placeholder="e.g. Sector 12, G-4"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all font-medium"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</label>
          <textarea
            value={activeJob.notes}
            onChange={(e) => updateActiveJobDetails({ notes: e.target.value })}
            placeholder="Fabrication details, edge cutting, special instructions..."
            rows={2}
            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all resize-none font-medium"
          />
        </div>
      </div>

      {/* Tiles Sections */}
      {activeJob.tiles.map((tile, tIdx) => {
        const isCollapsed = !!collapsedTiles[tile.id];
        return (
          <div key={tile.id} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            {/* Tile Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50/70 border-b border-slate-200 gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button 
                  onClick={() => toggleTileCollapse(tile.id)}
                  className="p-1 hover:bg-slate-200 rounded-sm transition-colors text-slate-500 cursor-pointer"
                >
                  {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
                <div className="flex-1 sm:flex-none">
                  <input
                    type="text"
                    value={tile.tileName}
                    onChange={(e) => updateTile(tile.id, { tileName: e.target.value })}
                    placeholder={`Tile ${tIdx + 1} Name (e.g. Kajaria Matt 60x60)`}
                    className="w-full sm:w-72 px-2.5 py-1.5 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <span className="text-2xs font-bold text-slate-400 uppercase">Rate:</span>
                  <div className="relative w-24">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      value={tile.ratePerSqft || ''}
                      onChange={(e) => updateTile(tile.id, { ratePerSqft: Number(e.target.value) })}
                      placeholder="Rate"
                      className="w-full pl-5 pr-2 py-1 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="text-right text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-sm border border-slate-200">
                  {tile.totalArea.toFixed(2)} sq ft &bull; ₹{tile.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>

                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${tile.tileName || `Tile ${tIdx + 1}`}?`)) {
                      deleteTile(tile.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all cursor-pointer"
                  title="Delete Tile Group"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Tile Body (Measurements Grid) */}
            {!isCollapsed && (
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xs text-slate-400 bg-slate-50 px-2 py-1 rounded-sm border border-slate-250 font-semibold">
                    Round rule: up to next 0.25 ft
                  </span>
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pr-3 w-40">Location / Label</th>
                        <th className="pb-3 px-3 w-28">Length (in)</th>
                        <th className="pb-3 px-3 w-28">Width (in)</th>
                        <th className="pb-3 px-3 w-20 text-center">Qty</th>
                        <th className="pb-3 px-3">Rounded L (ft)</th>
                        <th className="pb-3 px-3">Rounded W (ft)</th>
                        <th className="pb-3 px-3 text-right">Area/Pc</th>
                        <th className="pb-3 px-3 text-right">Total Area</th>
                        <th className="pb-3 pl-3 text-right w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tile.rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 group">
                          <td className="py-2 pr-3">
                            <input 
                              type="text" 
                              value={row.location}
                              onChange={(e) => updateTileRow(tile.id, row.id, 'location', e.target.value)} 
                              placeholder="e.g. Floor, Wall"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-medium" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              type="number" step="any" inputMode="decimal" 
                              value={row.lengthInches}
                              onChange={(e) => updateTileRow(tile.id, row.id, 'lengthInches', e.target.value)} 
                              placeholder="Length"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              type="number" step="any" inputMode="decimal" 
                              value={row.widthInches}
                              onChange={(e) => updateTileRow(tile.id, row.id, 'widthInches', e.target.value)} 
                              placeholder="Width"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              type="number" 
                              value={row.quantity}
                              onChange={(e) => updateTileRow(tile.id, row.id, 'quantity', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold text-center" 
                            />
                          </td>
                          <td className="py-2 px-3 text-sm font-semibold text-slate-500">
                            {row.roundedLengthFt > 0 ? `${row.roundedLengthFt.toFixed(2)} ft` : '-'}
                          </td>
                          <td className="py-2 px-3 text-sm font-semibold text-slate-500">
                            {row.roundedWidthFt > 0 ? `${row.roundedWidthFt.toFixed(2)} ft` : '-'}
                          </td>
                          <td className="py-2 px-3 text-sm font-semibold text-right text-slate-600">
                            {row.areaPerPiece > 0 ? row.areaPerPiece.toFixed(2) : '0.00'}
                          </td>
                          <td className="py-2 px-3 text-sm font-black text-right text-slate-900">
                            {row.totalArea > 0 ? row.totalArea.toFixed(2) : '0.00'}
                          </td>
                          <td className="py-2 pl-3 text-right">
                            <div className="flex justify-end space-x-1">
                              <button 
                                onClick={() => duplicateRowInTile(tile.id, row.id)} 
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-sm transition-colors cursor-pointer"
                              >
                                <Copy size={14} />
                              </button>
                              <button 
                                onClick={() => deleteRowFromTile(tile.id, row.id)} 
                                className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-500/10 rounded-sm transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="md:hidden space-y-3">
                  {tile.rows.map((row, idx) => (
                    <div key={row.id} className="border border-slate-200 rounded-sm p-3 bg-slate-55/40">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-2xs font-bold uppercase tracking-wider text-slate-450">Item {idx + 1}</span>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => duplicateRowInTile(tile.id, row.id)} 
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-sm transition-colors cursor-pointer"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            onClick={() => deleteRowFromTile(tile.id, row.id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-sm transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Location / Label</label>
                        <input 
                          type="text" 
                          value={row.location}
                          onChange={(e) => updateTileRow(tile.id, row.id, 'location', e.target.value)} 
                          placeholder="e.g. Floor, Wall, Staircase"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-medium" 
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Length (in)</label>
                          <input 
                            type="number" step="any" inputMode="decimal" 
                            value={row.lengthInches}
                            onChange={(e) => updateTileRow(tile.id, row.id, 'lengthInches', e.target.value)} 
                            placeholder="L"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Width (in)</label>
                          <input 
                            type="number" step="any" inputMode="decimal" 
                            value={row.widthInches}
                            onChange={(e) => updateTileRow(tile.id, row.id, 'widthInches', e.target.value)} 
                            placeholder="W"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Qty</label>
                          <input 
                            type="number" 
                            value={row.quantity}
                            onChange={(e) => updateTileRow(tile.id, row.id, 'quantity', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold text-center" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 bg-white border border-slate-200 rounded-sm p-2">
                        <div className="text-center">
                          <span className="block text-[9px] uppercase font-semibold text-slate-400">Rounded L</span>
                          <span className="text-xs font-bold text-slate-700">{row.roundedLengthFt > 0 ? `${row.roundedLengthFt.toFixed(2)} ft` : '-'}</span>
                        </div>
                        <div className="text-center border-x border-slate-200">
                          <span className="block text-[9px] uppercase font-semibold text-slate-400">Rounded W</span>
                          <span className="text-xs font-bold text-slate-700">{row.roundedWidthFt > 0 ? `${row.roundedWidthFt.toFixed(2)} ft` : '-'}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[9px] uppercase font-semibold text-slate-400">Total Area</span>
                          <span className="text-xs font-extrabold text-primary">{row.totalArea > 0 ? row.totalArea.toFixed(2) : '0.00'} <span className="text-[9px] font-normal text-slate-400">sq ft</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Row Button */}
                <div>
                  <button 
                    onClick={() => addRowToTile(tile.id)}
                    className="flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-primary font-bold px-4 py-2 rounded-sm text-xs transition-all border border-primary/20 cursor-pointer w-full md:w-auto"
                  >
                    <Plus size={14} />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Another Tile Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={addTile}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-sm text-sm transition-all cursor-pointer shadow-md"
        >
          <Plus size={16} />
          <span>Add Another Tile Group</span>
        </button>
      </div>

      {/* Actions Summary Card */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Estimate Summary</h3>
            <p className="text-2xs text-slate-450 mt-1">Make sure you have saved your job to access history reports.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
            <button onClick={handleSave}
              className="flex items-center justify-center space-x-1.5 bg-primary hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-sm shadow-md text-sm cursor-pointer">
              <Save size={16} /><span>Save Job</span>
            </button>
            <button onClick={handleWhatsAppShare}
              className="flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-900 font-semibold px-4 py-2.5 rounded-sm text-sm border border-slate-200 cursor-pointer">
              <Share2 size={16} className="text-primary" /><span>WhatsApp</span>
            </button>
            <button onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-sm text-sm border border-slate-200 cursor-pointer">
              <Printer size={16} /><span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Totals Bar */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 shadow-2xl flex justify-between items-center">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div>
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Area</span>
            <p className="text-sm md:text-base font-extrabold text-slate-900">
              {activeJob.totalArea.toFixed(2)} <span className="text-xs font-medium text-slate-500">sq ft</span>
            </p>
          </div>
          <div className="border-l border-slate-200 h-8" />
          <div>
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-400">Grand Total</span>
            <p className="text-sm md:text-base font-extrabold text-primary">
              ₹{activeJob.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <button onClick={handleSave}
          className="bg-primary hover:opacity-90 text-white font-bold px-4 py-2 rounded-sm text-xs flex items-center space-x-1 shadow-sm cursor-pointer">
          <Save size={14} /><span>Save</span>
        </button>
      </div>
    </div>
  );
}
