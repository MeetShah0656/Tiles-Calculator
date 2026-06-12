'use client';

import { useJobStore, MeasurementRow, Job } from '@/store/store';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Printer, 
  Share2, 
  Info,
  User,
  Phone,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { useState } from 'react';

export default function ActiveJobCalculator() {
  const { 
    activeJob, 
    updateActiveJobDetails, 
    addRow, 
    updateRow, 
    duplicateRow, 
    deleteRow, 
    saveJob,
    isOnline
  } = useJobStore();

  const [notification, setNotification] = useState('');

  const handleSave = () => {
    if (!activeJob.customerName || !activeJob.projectName) {
      alert('Please fill in Customer Name and Project Name before saving.');
      return;
    }
    
    const jobId = saveJob();
    setNotification('Job saved successfully! Check Job History.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppText = () => {
    const lines = [
      `*Yash Marble Calculation Summary*`,
      `========================`,
      `*Customer:* ${activeJob.customerName || 'N/A'}`,
      `*Project:* ${activeJob.projectName || 'N/A'}`,
      `*Address:* ${activeJob.siteAddress || 'N/A'}`,
      `*Total Area:* ${activeJob.totalArea.toFixed(2)} sq ft`,
      `*Rate:* ₹${activeJob.ratePerSqft}/sq ft`,
      `*Grand Total:* ₹${activeJob.grandTotal.toLocaleString('en-IN')}`,
      `========================`,
      `*Measurement Items:*`
    ];

    activeJob.rows.forEach((row, i) => {
      if (row.lengthInches && row.widthInches) {
        lines.push(
          `${i + 1}. ${row.lengthInches}" x ${row.widthInches}" | Qty: ${row.quantity} -> (Rounded: ${row.roundedLengthFt}ft x ${row.roundedWidthFt}ft) = *${row.totalArea.toFixed(2)} sq ft*`
        );
      }
    });

    return encodeURIComponent(lines.join('\n'));
  };

  const handleWhatsAppShare = () => {
    const text = getWhatsAppText();
    const phone = activeJob.phoneNumber ? activeJob.phoneNumber.replace(/[^0-9]/g, '') : '';
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Save Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-sm bg-primary text-white shadow-xl flex items-center space-x-2 animate-bounce">
          <Info size={16} />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Customer Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <User className="text-primary" size={18} />
          <span>Job details</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer Name */}
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={activeJob.customerName}
                onChange={(e) => updateActiveJobDetails({ customerName: e.target.value })}
                placeholder="e.g. ABC Builders"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-800 rounded-sm text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={activeJob.phoneNumber}
                onChange={(e) => updateActiveJobDetails({ phoneNumber: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-800 rounded-sm text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={activeJob.projectName}
                onChange={(e) => updateActiveJobDetails({ projectName: e.target.value })}
                placeholder="e.g. Ground Floor Kitchen"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-800 rounded-sm text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Site Address */}
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Site Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={activeJob.siteAddress}
                onChange={(e) => updateActiveJobDetails({ siteAddress: e.target.value })}
                placeholder="e.g. Sector 12, G-4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-800 rounded-sm text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Notes
          </label>
          <textarea
            value={activeJob.notes}
            onChange={(e) => updateActiveJobDetails({ notes: e.target.value })}
            placeholder="Fabrication details, granite edge cutting, special beveling instruction..."
            rows={2}
            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-800 rounded-sm text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none transition-all resize-none font-medium"
          />
        </div>
      </div>

      {/* Measurement Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="text-primary" size={18} />
            <span>Measurements (Inches)</span>
          </h2>
          <div className="text-2xs text-slate-500 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-850">
            Rules: Converted to ft & rounded UP to next <span className="text-primary font-bold">0.25 ft</span>
          </div>
        </div>

        {/* Responsive Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-2xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                <th className="pb-3 pr-3 w-28">Length (in)</th>
                <th className="pb-3 px-3 w-28">Width (in)</th>
                <th className="pb-3 px-3 w-20">Qty</th>
                <th className="pb-3 px-3">Rounded Length (ft)</th>
                <th className="pb-3 px-3">Rounded Width (ft)</th>
                <th className="pb-3 px-3 text-right">Area/Piece (sq ft)</th>
                <th className="pb-3 px-3 text-right">Total Area (sq ft)</th>
                <th className="pb-3 pl-3 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
              {activeJob.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 group">
                  {/* Length Input */}
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={row.lengthInches}
                      onChange={(e) => updateRow(row.id, 'lengthInches', e.target.value)}
                      placeholder="Length"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-850 rounded-sm text-slate-900 dark:text-white text-sm outline-none transition-all font-bold"
                    />
                  </td>
                  {/* Width Input */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={row.widthInches}
                      onChange={(e) => updateRow(row.id, 'widthInches', e.target.value)}
                      placeholder="Width"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-850 rounded-sm text-slate-900 dark:text-white text-sm outline-none transition-all font-bold"
                    />
                  </td>
                  {/* Quantity Input */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-850 rounded-sm text-slate-900 dark:text-white text-sm outline-none transition-all font-bold text-center"
                    />
                  </td>
                  {/* Rounded Length display */}
                  <td className="py-2.5 px-3 text-sm font-semibold text-slate-550 dark:text-slate-400">
                    {row.roundedLengthFt > 0 ? `${row.roundedLengthFt.toFixed(2)} ft` : '-'}
                  </td>
                  {/* Rounded Width display */}
                  <td className="py-2.5 px-3 text-sm font-semibold text-slate-550 dark:text-slate-400">
                    {row.roundedWidthFt > 0 ? `${row.roundedWidthFt.toFixed(2)} ft` : '-'}
                  </td>
                  {/* Area Per Piece display */}
                  <td className="py-2.5 px-3 text-sm font-semibold text-right text-slate-650 dark:text-slate-350">
                    {row.areaPerPiece > 0 ? `${row.areaPerPiece.toFixed(2)}` : '0.00'}
                  </td>
                  {/* Total Area display */}
                  <td className="py-2.5 px-3 text-sm font-black text-right text-slate-900 dark:text-white">
                    {row.totalArea > 0 ? `${row.totalArea.toFixed(2)}` : '0.00'}
                  </td>
                  {/* Actions buttons */}
                  <td className="py-2.5 pl-3 text-right">
                    <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => duplicateRow(row.id)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-sm transition-colors cursor-pointer"
                        title="Duplicate Row"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-sm transition-colors cursor-pointer"
                        title="Delete Row"
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

        {/* Add Row Button */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={addRow}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 text-primary font-bold px-4 py-2 rounded-sm text-sm transition-all border border-primary/20 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Pricing & Totals Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Coins className="text-primary" size={18} />
            <span>Pricing & Rates</span>
          </h2>
          <div>
            <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Rate Per Sq Ft (₹)
            </label>
            <div className="relative max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={activeJob.ratePerSqft || ''}
                onChange={(e) => updateActiveJobDetails({ ratePerSqft: Number(e.target.value) })}
                placeholder="120"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:border-slate-800 rounded-sm text-slate-900 dark:text-white text-sm outline-none transition-all font-bold"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col justify-end space-y-3">
          <div className="flex flex-wrap gap-2 justify-end">
            {/* Save Job */}
            <button
              onClick={handleSave}
              className="flex items-center justify-center space-x-1.5 bg-primary hover:opacity-90 active:opacity-95 text-white font-semibold px-5 py-2.5 rounded-sm shadow-md shadow-primary/20 text-sm transition-all cursor-pointer"
            >
              <Save size={16} />
              <span>Save Job Sheet</span>
            </button>
            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center space-x-1.5 bg-slate-900 hover:opacity-90 text-white dark:bg-slate-950 dark:hover:bg-slate-900 font-semibold px-4 py-2.5 rounded-sm text-sm transition-all border border-primary/20 cursor-pointer"
            >
              <Share2 size={16} className="text-primary" />
              <span>Share to WhatsApp</span>
            </button>
            {/* Print View */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-300 font-semibold px-4 py-2.5 rounded-sm text-sm transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
            >
              <Printer size={16} />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Totals Bar (Mobile First one-handed reach) */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-slate-950 border-t border-slate-900 px-4 py-3.5 shadow-2xl flex justify-between items-center max-w-7xl mx-auto md:rounded-t-sm md:border-x">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Area</span>
            <p className="text-base font-extrabold text-white">
              {activeJob.totalArea.toFixed(2)} <span className="text-xs font-medium text-slate-400">sq ft</span>
            </p>
          </div>
          <div className="border-l border-slate-800 h-8" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Material Cost</span>
            <p className="text-base font-extrabold text-primary-foreground">
              ₹{activeJob.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-primary hover:opacity-90 active:opacity-95 text-white font-bold px-4 py-2 rounded-sm text-xs flex items-center space-x-1 shadow-sm cursor-pointer"
        >
          <Save size={14} />
          <span>Save Sheet</span>
        </button>
      </div>
    </div>
  );
}
