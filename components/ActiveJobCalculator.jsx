'use client';

import { useJobStore } from '@/store/store.js';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Printer, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  X, 
  Camera,
  Lock,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import MeasurementScannerDialog from './MeasurementScannerDialog.jsx';
import UpgradeProModal from './UpgradeProModal.jsx';

export default function ActiveJobCalculator({
  jobType = 'activeJob',
  roundingStep = 0.25,
  categoryTitle = 'Granite & Marble'
}) {
  const store = useJobStore();
  const targetJob = store[jobType] || store.activeJob;
  const subscription = store.subscription || { isPro: false };
  const isPro = subscription.isPro;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const totalRowsCount = (targetJob.tiles || []).reduce((acc, t) => acc + (t.rows ? t.rows.length : 0), 0);

  const updateActiveJobDetails = (fields) => {
    if (jobType === 'quotaActiveJob') {
      store.updateQuotaActiveJobDetails(fields);
    } else {
      store.updateActiveJobDetails(fields);
    }
  };

  const addTile = () => store.addTile(jobType);
  const updateTile = (tileId, fields) => store.updateTile(tileId, fields, jobType);
  const deleteTile = (tileId) => store.deleteTile(tileId, jobType);

  const handleAddRowToTile = (tileId) => {
    if (!isPro && totalRowsCount >= 5) {
      setIsUpgradeModalOpen(true);
      return;
    }
    store.addRowToTile(tileId, jobType);
  };

  const handleDuplicateRowInTile = (tileId, rowId) => {
    if (!isPro && totalRowsCount >= 5) {
      setIsUpgradeModalOpen(true);
      return;
    }
    store.duplicateRowInTile(tileId, rowId, jobType);
  };

  const updateTileRow = (tileId, rowId, field, value) => store.updateTileRow(tileId, rowId, field, value, jobType);
  const deleteRowFromTile = (tileId, rowId) => store.deleteRowFromTile(tileId, rowId, jobType);
  const addScannedRowsToTile = (tileId, rooms) => store.addScannedRowsToTile(tileId, rooms, jobType);

  const [notification, setNotification] = useState('');
  const [collapsedTiles, setCollapsedTiles] = useState({});
  const [sharePdfBlob, setSharePdfBlob] = useState(null);
  const [sharePdfFilename, setSharePdfFilename] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState('generating');
  const [shareError, setShareError] = useState('');
  const [scanningTileId, setScanningTileId] = useState(null);

  const handlePrint = () => { window.print(); };

  const toggleTileCollapse = (tileId) => {
    setCollapsedTiles(prev => ({
      ...prev,
      [tileId]: !prev[tileId]
    }));
  };

  const getWhatsAppText = () => {
    const lines = [
      `*TIVERA (${categoryTitle}) Calculation Summary*`,
      `========================`,
      `*Customer:* ${targetJob.customerName || 'N/A'}`,
      `*Address:* ${targetJob.siteAddress || 'N/A'}`,
      `*Total Area:* ${targetJob.totalArea.toFixed(2)} sq ft`,
      `*Grand Total:* ₹${targetJob.grandTotal.toLocaleString('en-IN')}`,
      `========================`
    ];

    targetJob.tiles.forEach((tile, idx) => {
      lines.push(
        `\n*Category ${idx + 1}: ${tile.tileName || 'Unnamed Category'}*`,
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
    setIsShareModalOpen(true);
    setShareStatus('generating');
    setShareError('');

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = document.getElementById('printable-invoice');
      if (!element) throw new Error("Printable invoice DOM element not found.");

      const options = {
        margin: [8, 8, 8, 8],
        filename: 'TIVERA_Estimate.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdf = await html2pdf().from(element).set(options).outputPdf();
      
      const blob = pdf.output('blob');
      const safeCustomerName = (targetJob.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `Estimate_${safeCustomerName}_TIVERA.pdf`;
      
      setSharePdfBlob(blob);
      setSharePdfFilename(filename);
      setShareStatus('ready');
    } catch (err) {
      console.error('Failed to generate PDF for WhatsApp share:', err);
      setShareStatus('error');
      setShareError(err?.message || 'Failed to render PDF invoice. You can still share text details.');
    }
  };

  const executeWebShare = async () => {
    if (!sharePdfBlob) return;
    const file = new File([sharePdfBlob], sharePdfFilename, { type: 'application/pdf' });
    const text = getWhatsAppText();

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'TIVERA Estimate Invoice',
          text: decodeURIComponent(text)
        });
      } catch (e) {
        if (e.name !== 'AbortError') {
          window.open(`https://wa.me/?text=${text}`, '_blank');
        }
      }
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const handleCopyText = () => {
    const text = decodeURIComponent(getWhatsAppText());
    navigator.clipboard.writeText(text);
    setNotification('Summary copied to clipboard!');
    setTimeout(() => setNotification(''), 3000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Title & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-zinc-200 p-4 md:p-6 rounded-sm shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-3xs font-extrabold text-zinc-400 uppercase tracking-widest block">
              {categoryTitle} ESTIMATOR
            </span>
            {!isPro && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-2 py-0.5 bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300 text-3xs font-black rounded-2xs uppercase transition-all cursor-pointer flex items-center space-x-1"
              >
                <Sparkles size={10} className="text-amber-600" />
                <span>Upgrade to TIVERA Pro</span>
              </button>
            )}
            {isPro && (
              <span className="px-2 py-0.5 bg-zinc-950 text-white text-3xs font-black rounded-2xs uppercase border border-zinc-800 flex items-center space-x-1">
                <Sparkles size={10} className="text-amber-300" />
                <span>TIVERA Pro Active</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight uppercase">
            {categoryTitle} Operations
          </h1>
          <p className="text-xs font-bold text-zinc-500 mt-0.5">
            Enter length & width in inches. Step calculations ({roundingStep} ft rounding) are handled automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-950 rounded-sm text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-zinc-950 hover:bg-black text-white rounded-sm text-xs font-black transition-all cursor-pointer shadow-md border border-zinc-800 uppercase tracking-wider"
          >
            <Share2 size={16} />
            <span>WhatsApp Invoice</span>
          </button>
        </div>
      </div>

      {!isPro && totalRowsCount >= 5 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-2xs">
              <Lock size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950 uppercase">Free Plan Item Limit Reached ({totalRowsCount}/5 items)</h4>
              <p className="text-3xs font-semibold text-amber-800">
                You have reached the maximum 5 measurement rows allowed on the Free tier. Upgrade to TIVERA Pro for unlimited items.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-2 bg-zinc-950 text-white rounded-sm text-xs font-black uppercase hover:bg-black transition-all cursor-pointer whitespace-nowrap border border-zinc-800 shadow-sm"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {notification && (
        <div className="p-3 bg-zinc-950 text-white rounded-sm text-xs font-bold flex items-center space-x-2 animate-fadeIn border border-zinc-800">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Customer Info Form */}
      <div className="bg-white border border-zinc-200 rounded-sm p-4 md:p-6 shadow-2xs space-y-4">
        <h2 className="text-xs font-black text-zinc-950 uppercase tracking-wider border-l-2 border-zinc-950 pl-2">
          Customer & Site Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-3xs font-extrabold text-zinc-400 uppercase tracking-wider mb-1">Customer Name *</label>
            <input
              type="text"
              value={targetJob.customerName}
              onChange={(e) => updateActiveJobDetails({ customerName: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3 py-2 border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-sm text-xs font-bold text-zinc-950 bg-white"
            />
          </div>
          <div>
            <label className="block text-3xs font-extrabold text-zinc-400 uppercase tracking-wider mb-1">Phone Number</label>
            <input
              type="text"
              value={targetJob.phoneNumber}
              onChange={(e) => updateActiveJobDetails({ phoneNumber: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3 py-2 border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-sm text-xs font-bold text-zinc-950 bg-white"
            />
          </div>
          <div>
            <label className="block text-3xs font-extrabold text-zinc-400 uppercase tracking-wider mb-1">Site Address</label>
            <input
              type="text"
              value={targetJob.siteAddress}
              onChange={(e) => updateActiveJobDetails({ siteAddress: e.target.value })}
              placeholder="e.g. Flat 302, Green Acres"
              className="w-full px-3 py-2 border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-sm text-xs font-bold text-zinc-950 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tile Groups List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black text-zinc-950 uppercase tracking-wider border-l-2 border-zinc-950 pl-2">
            Measurement Groups ({targetJob.tiles.length})
          </h2>
          <button
            onClick={addTile}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-950 text-white border border-zinc-800 hover:bg-black rounded-sm text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
          >
            <Plus size={14} />
            <span>Add Category Group</span>
          </button>
        </div>

        {targetJob.tiles.map((tile, tileIdx) => {
          const isCollapsed = collapsedTiles[tile.id];

          return (
            <div 
              key={tile.id} 
              className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden transition-all"
            >
              {/* Card Header */}
              <div className="bg-zinc-50/80 p-4 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => toggleTileCollapse(tile.id)}
                    className="p-1 hover:bg-zinc-200 rounded-2xs text-zinc-600 transition-colors cursor-pointer"
                  >
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                  <div className="flex-1 sm:flex-none">
                    <input
                      type="text"
                      value={tile.tileName}
                      onChange={(e) => updateTile(tile.id, { tileName: e.target.value })}
                      placeholder={`Category ${tileIdx + 1}`}
                      className="text-sm font-black text-zinc-950 bg-transparent border-b border-dashed border-zinc-300 focus:border-zinc-950 focus:outline-none px-1 py-0.5 w-full sm:w-64 uppercase"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-3xs font-extrabold text-zinc-400 uppercase">Rate/sqft (₹):</span>
                    <input
                      type="number"
                      value={tile.ratePerSqft}
                      onChange={(e) => updateTile(tile.id, { ratePerSqft: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-20 px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-black text-zinc-950 text-right focus:border-zinc-950 outline-none"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-3xs font-extrabold text-zinc-400 uppercase block">Subtotal</span>
                    <span className="text-sm font-black text-zinc-950">{formatCurrency(tile.subtotal)}</span>
                  </div>

                  <button
                    onClick={() => deleteTile(tile.id)}
                    className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-2xs transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-4 space-y-4">
                  {/* Rows Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-450 font-black uppercase text-[10px]">
                          <th className="pb-2 w-1/4">Location / Space</th>
                          <th className="pb-2 text-center">Length (in)</th>
                          <th className="pb-2 text-center">Width (in)</th>
                          <th className="pb-2 text-center">Qty</th>
                          <th className="pb-2 text-center">Rounded (ft)</th>
                          <th className="pb-2 text-right">Piece Sq Ft</th>
                          <th className="pb-2 text-right">Total Sq Ft</th>
                          <th className="pb-2 text-center w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 font-semibold text-zinc-800">
                        {tile.rows.map((row) => (
                          <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-2 pr-2">
                              <input
                                type="text"
                                value={row.location}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'location', e.target.value)}
                                placeholder="e.g. Living Room Floor"
                                className="w-full px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 focus:border-zinc-950 outline-none"
                              />
                            </td>
                            <td className="py-2 text-center px-1">
                              <input
                                type="text"
                                value={row.lengthInches}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'lengthInches', e.target.value)}
                                placeholder="0"
                                className="w-16 px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 text-center focus:border-zinc-950 outline-none"
                              />
                            </td>
                            <td className="py-2 text-center px-1">
                              <input
                                type="text"
                                value={row.widthInches}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'widthInches', e.target.value)}
                                placeholder="0"
                                className="w-16 px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 text-center focus:border-zinc-950 outline-none"
                              />
                            </td>
                            <td className="py-2 text-center px-1">
                              <input
                                type="number"
                                value={row.quantity}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'quantity', e.target.value)}
                                className="w-14 px-2 py-1 border border-zinc-200 rounded-2xs text-xs font-bold text-zinc-950 text-center focus:border-zinc-950 outline-none"
                              />
                            </td>
                            <td className="py-2 text-center text-zinc-500 font-medium">
                              {row.roundedLengthFt > 0 || row.roundedWidthFt > 0 
                                ? `${row.roundedLengthFt}' × ${row.roundedWidthFt}'` 
                                : '-'}
                            </td>
                            <td className="py-2 text-right font-bold text-zinc-900">
                              {row.areaPerPiece > 0 ? row.areaPerPiece.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 text-right font-black text-zinc-950">
                              {row.totalArea > 0 ? `${row.totalArea.toFixed(2)} sq ft` : '-'}
                            </td>
                            <td className="py-2 text-center space-x-1">
                              <button
                                onClick={() => handleDuplicateRowInTile(tile.id, row.id)}
                                className="p-1 text-zinc-400 hover:text-zinc-950 rounded-2xs transition-colors cursor-pointer"
                                title="Duplicate Row"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => deleteRowFromTile(tile.id, row.id)}
                                className="p-1 text-zinc-400 hover:text-black rounded-2xs transition-colors cursor-pointer"
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Action Bar for scanning paper notes & adding rows at bottom of table */}
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-150">
                    <button
                      onClick={() => handleAddRowToTile(tile.id)}
                      className="flex items-center space-x-1 text-2xs font-extrabold text-zinc-950 hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      <Plus size={14} />
                      <span>Add Measurement Row</span>
                    </button>
                    <button
                      onClick={() => setScanningTileId(tile.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-950 text-white border border-zinc-800 hover:bg-black rounded-2xs text-2xs font-bold transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Camera size={12} className="text-white" />
                      <span>Scan Paper Sheet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="bg-zinc-950 text-white p-4 md:p-6 rounded-sm shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-zinc-800">
        <div className="flex items-center space-x-8 text-xs font-bold">
          <div>
            <span className="text-zinc-400 text-3xs uppercase block">Total Area</span>
            <span className="text-base font-black text-white">{targetJob.totalArea.toFixed(2)} Sq Ft</span>
          </div>
          <div>
            <span className="text-zinc-400 text-3xs uppercase block">Total Pieces</span>
            <span className="text-base font-black text-zinc-300">{targetJob.totalQuantity} Pcs</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-zinc-400 text-3xs uppercase block font-extrabold">Grand Total</span>
          <span className="text-2xl font-black text-white">{formatCurrency(targetJob.grandTotal)}</span>
        </div>
      </div>

      {/* Scanner Dialog Modal */}
      {scanningTileId && (
        <MeasurementScannerDialog
          tileId={scanningTileId}
          onClose={() => setScanningTileId(null)}
          onImportMeasurements={(rooms) => {
            addScannedRowsToTile(scanningTileId, rooms);
            setScanningTileId(null);
          }}
        />
      )}

      {/* Upgrade Pro Modal */}
      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* WhatsApp Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-sm border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider">Share Estimate Invoice</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-zinc-400 hover:text-zinc-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {shareStatus === 'generating' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-zinc-600">Generating PDF Invoice document...</p>
              </div>
            )}

            {shareStatus === 'ready' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-zinc-600">
                  Ready! Click below to send PDF invoice & text summary on WhatsApp.
                </p>
                <button
                  onClick={executeWebShare}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 uppercase tracking-wider"
                >
                  <Share2 size={16} />
                  <span>Send PDF Invoice on WhatsApp</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-sm transition-all cursor-pointer"
                >
                  Copy Text Summary Only
                </button>
              </div>
            )}

            {shareStatus === 'error' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-rose-700">{shareError}</p>
                <button
                  onClick={handleCopyText}
                  className="w-full py-2 bg-zinc-950 text-white font-bold text-xs rounded-sm cursor-pointer"
                >
                  Copy Summary Text
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
