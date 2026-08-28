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

  const handleOpenScanner = (tileId) => {
    if (!isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setScanningTileId(tileId);
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

  const handlePrint = () => {
    if (!isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }
    window.print();
  };

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
    if (!isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }

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
      {/* Header Title & Actions (GAZU Style) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#f4f2ee] border border-[#d4d1ca] p-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-[#6b6863] uppercase tracking-[0.25em] block">
              {categoryTitle} ESTIMATOR
            </span>
            {!isPro && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-2 py-0.5 bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300 text-3xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1"
              >
                <Sparkles size={10} className="text-amber-600" />
                <span>UPGRADE TO PRO</span>
              </button>
            )}
            {isPro && (
              <span className="px-2 py-0.5 bg-[#0a0a0a] text-white text-3xs font-black uppercase tracking-wider flex items-center space-x-1">
                <Sparkles size={10} className="text-amber-300" />
                <span>PRO ACTIVE</span>
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-[#0a0a0a] tracking-[0.15em] uppercase mt-1">
            {categoryTitle} OPERATIONS
          </h1>
          <p className="text-xs font-bold text-[#6b6863] uppercase tracking-wider mt-0.5">
            Step calculations ({roundingStep} ft rounding) are applied automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className={`flex items-center space-x-2 px-5 py-3 border font-black text-xs tracking-[0.2em] uppercase transition-all cursor-pointer ${
              isPro 
                ? 'bg-white border-black hover:bg-[#e8e6e1] text-[#0a0a0a]'
                : 'bg-[#e8e6e1] border-[#d4d1ca] text-[#6b6863] hover:border-black'
            }`}
          >
            {isPro ? <Printer size={16} /> : <Lock size={14} className="text-amber-600" />}
            <span>PRINT INVOICE</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className={`flex items-center space-x-2 px-5 py-3 font-black text-xs tracking-[0.2em] uppercase transition-all cursor-pointer border border-black ${
              isPro
                ? 'bg-[#0a0a0a] hover:bg-neutral-800 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-[#0a0a0a]'
            }`}
          >
            {isPro ? <Share2 size={16} /> : <Lock size={14} className="text-amber-300" />}
            <span>WHATSAPP INVOICE</span>
          </button>
        </div>
      </div>

      {!isPro && (
        <div className="p-5 bg-[#0a0a0a] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-black">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-400 text-[#0a0a0a] font-black">
              <Lock size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">FREE TIER FEATURE RESTRICTIONS</h4>
              <p className="text-3xs font-semibold tracking-wider text-neutral-300 uppercase">
                Printing, PDF Export, WhatsApp Sharing, and Paper Note Scanning require a <strong className="text-white">TIVERA PRO</strong> subscription.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-5 py-2.5 bg-white text-[#0a0a0a] text-xs font-black tracking-[0.2em] uppercase hover:bg-neutral-200 transition-all cursor-pointer whitespace-nowrap border border-white"
          >
            UPGRADE TO PRO
          </button>
        </div>
      )}

      {notification && (
        <div className="p-3 bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-wider flex items-center space-x-2 animate-fadeIn border border-black">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Customer Info Form */}
      <div className="bg-[#f4f2ee] border border-[#d4d1ca] p-6 space-y-4">
        <h2 className="text-xs font-black text-[#0a0a0a] uppercase tracking-[0.2em] border-l-2 border-[#0a0a0a] pl-3">
          CUSTOMER & SITE INFORMATION
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1">Customer Name *</label>
            <input
              type="text"
              value={targetJob.customerName}
              onChange={(e) => updateActiveJobDetails({ customerName: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1">Phone Number</label>
            <input
              type="text"
              value={targetJob.phoneNumber}
              onChange={(e) => updateActiveJobDetails({ phoneNumber: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1">Site Address</label>
            <input
              type="text"
              value={targetJob.siteAddress}
              onChange={(e) => updateActiveJobDetails({ siteAddress: e.target.value })}
              placeholder="e.g. Flat 302, Green Acres"
              className="w-full px-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tile Groups List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black text-[#0a0a0a] uppercase tracking-[0.2em] border-l-2 border-[#0a0a0a] pl-3">
            MEASUREMENT GROUPS ({targetJob.tiles.length})
          </h2>
          <button
            onClick={addTile}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#0a0a0a] text-white border border-black hover:bg-neutral-800 text-xs font-black transition-all cursor-pointer uppercase tracking-[0.2em]"
          >
            <Plus size={14} />
            <span>ADD CATEGORY GROUP</span>
          </button>
        </div>

        {targetJob.tiles.map((tile, tileIdx) => {
          const isCollapsed = collapsedTiles[tile.id];

          return (
            <div 
              key={tile.id} 
              className="bg-[#f4f2ee] border border-[#d4d1ca] overflow-hidden transition-all"
            >
              {/* Card Header */}
              <div className="bg-[#e8e6e1] p-4 border-b border-[#d4d1ca] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => toggleTileCollapse(tile.id)}
                    className="p-1 hover:bg-[#d4d1ca] text-[#0a0a0a] transition-colors cursor-pointer"
                  >
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                  <div className="flex-1 sm:flex-none">
                    <input
                      type="text"
                      value={tile.tileName}
                      onChange={(e) => updateTile(tile.id, { tileName: e.target.value })}
                      placeholder={`Category ${tileIdx + 1}`}
                      className="text-sm font-black text-[#0a0a0a] bg-transparent border-b border-dashed border-[#0a0a0a] focus:outline-none px-1 py-0.5 w-full sm:w-64 uppercase tracking-wider"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-[#6b6863] uppercase tracking-wider">Rate/sqft (₹):</span>
                    <input
                      type="number"
                      value={tile.ratePerSqft}
                      onChange={(e) => updateTile(tile.id, { ratePerSqft: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-24 px-2.5 py-1 border border-[#d4d1ca] text-xs font-black text-[#0a0a0a] text-right focus:border-[#0a0a0a] bg-white outline-none"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#6b6863] uppercase tracking-wider block">Subtotal</span>
                    <span className="text-sm font-black text-[#0a0a0a]">{formatCurrency(tile.subtotal)}</span>
                  </div>

                  <button
                    onClick={() => deleteTile(tile.id)}
                    className="p-1.5 text-[#6b6863] hover:text-[#0a0a0a] transition-colors cursor-pointer"
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
                        <tr className="border-b border-[#d4d1ca] text-[#6b6863] font-black uppercase text-[10px] tracking-wider">
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
                      <tbody className="divide-y divide-[#d4d1ca] font-semibold text-[#0a0a0a]">
                        {tile.rows.map((row) => (
                          <tr key={row.id} className="hover:bg-[#e8e6e1] transition-colors">
                            <td className="py-2 pr-2">
                              <input
                                type="text"
                                value={row.location}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'location', e.target.value)}
                                placeholder="e.g. Living Room Floor"
                                className="w-full px-2 py-1 border border-[#d4d1ca] text-xs font-bold text-[#0a0a0a] focus:border-[#0a0a0a] bg-white outline-none"
                              />
                            </td>
                            <td className="py-2 text-center px-1">
                              <input
                                type="text"
                                value={row.lengthInches}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'lengthInches', e.target.value)}
                                placeholder="0"
                                className="w-16 px-2 py-1 border border-[#d4d1ca] text-xs font-bold text-[#0a0a0a] text-center focus:border-[#0a0a0a] bg-white outline-none"
                              />
                            </td>
                            <td className="py-2 text-center px-1">
                              <input
                                type="text"
                                value={row.widthInches}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'widthInches', e.target.value)}
                                placeholder="0"
                                className="w-16 px-2 py-1 border border-[#d4d1ca] text-xs font-bold text-[#0a0a0a] text-center focus:border-[#0a0a0a] bg-white outline-none"
                              />
                            </td>
                            <td className="py-2 text-center px-1">
                              <input
                                type="number"
                                value={row.quantity}
                                onChange={(e) => updateTileRow(tile.id, row.id, 'quantity', e.target.value)}
                                className="w-14 px-2 py-1 border border-[#d4d1ca] text-xs font-bold text-[#0a0a0a] text-center focus:border-[#0a0a0a] bg-white outline-none"
                              />
                            </td>
                            <td className="py-2 text-center text-[#6b6863] font-bold">
                              {row.roundedLengthFt > 0 || row.roundedWidthFt > 0 
                                ? `${row.roundedLengthFt}' × ${row.roundedWidthFt}'` 
                                : '-'}
                            </td>
                            <td className="py-2 text-right font-bold text-[#0a0a0a]">
                              {row.areaPerPiece > 0 ? row.areaPerPiece.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 text-right font-black text-[#0a0a0a]">
                              {row.totalArea > 0 ? `${row.totalArea.toFixed(2)} sq ft` : '-'}
                            </td>
                            <td className="py-2 text-center space-x-1">
                              <button
                                onClick={() => handleDuplicateRowInTile(tile.id, row.id)}
                                className="p-1 text-[#6b6863] hover:text-[#0a0a0a] cursor-pointer"
                                title="Duplicate Row"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => deleteRowFromTile(tile.id, row.id)}
                                className="p-1 text-[#6b6863] hover:text-[#0a0a0a] cursor-pointer"
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
                  <div className="flex justify-between items-center pt-3 border-t border-[#d4d1ca]">
                    <button
                      onClick={() => handleAddRowToTile(tile.id)}
                      className="flex items-center space-x-1 text-xs font-black text-[#0a0a0a] hover:underline cursor-pointer uppercase tracking-widest"
                    >
                      <Plus size={14} />
                      <span>ADD MEASUREMENT ROW</span>
                    </button>
                    <button
                      onClick={() => handleOpenScanner(tile.id)}
                      className={`flex items-center space-x-1 px-3 py-1.5 border text-xs font-black transition-all cursor-pointer uppercase tracking-widest ${
                        isPro 
                          ? 'bg-[#0a0a0a] text-white border-black hover:bg-neutral-800' 
                          : 'bg-[#e8e6e1] text-[#6b6863] border-[#d4d1ca] hover:border-black'
                      }`}
                    >
                      {isPro ? <Camera size={12} className="text-white" /> : <Lock size={12} className="text-amber-600" />}
                      <span>SCAN PAPER SHEET</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="bg-[#0a0a0a] text-white p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-black">
        <div className="flex items-center space-x-10 text-xs font-black tracking-widest uppercase">
          <div>
            <span className="text-neutral-400 text-[10px] block">TOTAL AREA</span>
            <span className="text-lg font-black text-white">{targetJob.totalArea.toFixed(2)} SQ FT</span>
          </div>
          <div>
            <span className="text-neutral-400 text-[10px] block">TOTAL PIECES</span>
            <span className="text-lg font-black text-neutral-300">{targetJob.totalQuantity} PCS</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-neutral-400 text-[10px] uppercase block font-black tracking-widest">GRAND TOTAL</span>
          <span className="text-3xl font-black text-white tracking-wider">{formatCurrency(targetJob.grandTotal)}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#f4f2ee] border border-[#d4d1ca] shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#d4d1ca] pb-3">
              <h3 className="text-xs font-black text-[#0a0a0a] uppercase tracking-widest">SHARE ESTIMATE INVOICE</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-[#6b6863] hover:text-[#0a0a0a] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {shareStatus === 'generating' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#0a0a0a] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-[#6b6863] uppercase tracking-wider">Generating PDF Invoice...</p>
              </div>
            )}

            {shareStatus === 'ready' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#6b6863] uppercase tracking-wider">
                  Ready! Click below to send PDF invoice & text summary on WhatsApp.
                </p>
                <button
                  onClick={executeWebShare}
                  className="w-full py-3 bg-[#0a0a0a] hover:bg-neutral-800 text-white font-black text-xs tracking-widest cursor-pointer flex items-center justify-center space-x-2 uppercase border border-black"
                >
                  <Share2 size={16} />
                  <span>SEND PDF ON WHATSAPP</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="w-full py-2.5 bg-[#e8e6e1] hover:bg-[#d4d1ca] text-[#0a0a0a] font-black text-xs cursor-pointer uppercase tracking-wider"
                >
                  COPY TEXT SUMMARY ONLY
                </button>
              </div>
            )}

            {shareStatus === 'error' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-rose-700">{shareError}</p>
                <button
                  onClick={handleCopyText}
                  className="w-full py-2.5 bg-[#0a0a0a] text-white font-black text-xs uppercase tracking-wider"
                >
                  COPY SUMMARY TEXT
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
