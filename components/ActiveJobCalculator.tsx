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
    saveJob();
    setNotification('Job saved successfully! Check Job History.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handlePrint = () => { window.print(); };

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
        lines.push(`${i + 1}. ${row.lengthInches}" x ${row.widthInches}" | Qty: ${row.quantity} -> ${row.totalArea.toFixed(2)} sq ft`);
      }
    });
    return encodeURIComponent(lines.join('\n'));
  };

  const handleWhatsAppShare = () => {
    const text = getWhatsAppText();
    const phone = activeJob.phoneNumber ? activeJob.phoneNumber.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
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

      {/* Measurement Card */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="text-primary" size={18} />
            <span>Measurements (Inches)</span>
          </h2>
          <div className="text-2xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-sm border border-slate-200 self-start sm:self-auto">
            Rounded UP to next <span className="text-primary font-bold">0.25 ft</span>
          </div>
        </div>

        {/* DESKTOP TABLE (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-3 w-28">Length (in)</th>
                <th className="pb-3 px-3 w-28">Width (in)</th>
                <th className="pb-3 px-3 w-20">Qty</th>
                <th className="pb-3 px-3">Rounded L (ft)</th>
                <th className="pb-3 px-3">Rounded W (ft)</th>
                <th className="pb-3 px-3 text-right">Area/Pc</th>
                <th className="pb-3 px-3 text-right">Total Area</th>
                <th className="pb-3 pl-3 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeJob.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 group">
                  <td className="py-2.5 pr-3">
                    <input type="number" step="any" inputMode="decimal" value={row.lengthInches}
                      onChange={(e) => updateRow(row.id, 'lengthInches', e.target.value)} placeholder="Length"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" />
                  </td>
                  <td className="py-2.5 px-3">
                    <input type="number" step="any" inputMode="decimal" value={row.widthInches}
                      onChange={(e) => updateRow(row.id, 'widthInches', e.target.value)} placeholder="Width"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" />
                  </td>
                  <td className="py-2.5 px-3">
                    <input type="number" value={row.quantity}
                      onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold text-center" />
                  </td>
                  <td className="py-2.5 px-3 text-sm font-semibold text-slate-500">{row.roundedLengthFt > 0 ? `${row.roundedLengthFt.toFixed(2)} ft` : '-'}</td>
                  <td className="py-2.5 px-3 text-sm font-semibold text-slate-500">{row.roundedWidthFt > 0 ? `${row.roundedWidthFt.toFixed(2)} ft` : '-'}</td>
                  <td className="py-2.5 px-3 text-sm font-semibold text-right text-slate-600">{row.areaPerPiece > 0 ? row.areaPerPiece.toFixed(2) : '0.00'}</td>
                  <td className="py-2.5 px-3 text-sm font-black text-right text-slate-900">{row.totalArea > 0 ? row.totalArea.toFixed(2) : '0.00'}</td>
                  <td className="py-2.5 pl-3 text-right">
                    <div className="flex justify-end space-x-1">
                      <button onClick={() => duplicateRow(row.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-sm transition-colors cursor-pointer"><Copy size={14} /></button>
                      <button onClick={() => deleteRow(row.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-sm transition-colors cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS (< md) */}
        <div className="md:hidden space-y-3">
          {activeJob.rows.map((row, idx) => (
            <div key={row.id} className="border border-slate-200 rounded-sm p-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Piece {idx + 1}</span>
                <div className="flex space-x-1">
                  <button onClick={() => duplicateRow(row.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-sm transition-colors cursor-pointer"><Copy size={14} /></button>
                  <button onClick={() => deleteRow(row.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-sm transition-colors cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Length (in)</label>
                  <input type="number" step="any" inputMode="decimal" value={row.lengthInches}
                    onChange={(e) => updateRow(row.id, 'lengthInches', e.target.value)} placeholder="L"
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Width (in)</label>
                  <input type="number" step="any" inputMode="decimal" value={row.widthInches}
                    onChange={(e) => updateRow(row.id, 'widthInches', e.target.value)} placeholder="W"
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Qty</label>
                  <input type="number" value={row.quantity}
                    onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none font-bold text-center" />
                </div>
              </div>
              <div className="grid grid-cols-3 bg-white border border-slate-200 rounded-sm p-2">
                <div className="text-center">
                  <span className="block text-[9px] uppercase font-semibold text-slate-400">Rounded L</span>
                  <span className="text-sm font-bold text-slate-700">{row.roundedLengthFt > 0 ? `${row.roundedLengthFt.toFixed(2)} ft` : '-'}</span>
                </div>
                <div className="text-center border-x border-slate-200">
                  <span className="block text-[9px] uppercase font-semibold text-slate-400">Rounded W</span>
                  <span className="text-sm font-bold text-slate-700">{row.roundedWidthFt > 0 ? `${row.roundedWidthFt.toFixed(2)} ft` : '-'}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] uppercase font-semibold text-slate-400">Total Area</span>
                  <span className="text-sm font-extrabold text-primary">{row.totalArea > 0 ? row.totalArea.toFixed(2) : '0.00'} <span className="text-[9px] font-normal text-slate-400">sq ft</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Row Button */}
        <div className="mt-4">
          <button onClick={addRow}
            className="flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-primary font-bold px-4 py-2.5 rounded-sm text-sm transition-all border border-primary/20 cursor-pointer w-full md:w-auto">
            <Plus size={16} />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Pricing & Actions Card */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Coins className="text-primary" size={18} />
              <span>Pricing & Rates</span>
            </h2>
            <div>
              <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rate Per Sq Ft (₹)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">₹</span>
                <input type="number" value={activeJob.ratePerSqft || ''}
                  onChange={(e) => updateActiveJobDetails({ ratePerSqft: Number(e.target.value) })}
                  placeholder="120"
                  className="w-full md:max-w-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 text-sm outline-none transition-all font-bold" />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Cost</span>
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
