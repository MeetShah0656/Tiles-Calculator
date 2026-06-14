'use client';

import React from 'react';
import { Job } from '@/store/store';
import { X, Printer } from 'lucide-react';

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
}

export default function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  if (!job) return null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div 
      className="fixed inset-0 z-55 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn no-print"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-sm w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl p-5 sm:p-6 animate-scaleUp cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-3 flex-shrink-0">
          <div>
            <span className="text-4xs uppercase font-black text-primary tracking-wider">Job Detailed View</span>
            <h3 className="text-xs font-black text-slate-900 mt-0.5">{job.customerName}</h3>
            <p className="text-3xs font-semibold text-slate-500 mt-0.5">{job.projectName}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-sm transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body (Details) */}
        <div className="space-y-4.5 flex-grow overflow-y-auto pr-1 my-3">
          {/* Info Blocks */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-sm border border-slate-200 text-3xs">
            <div>
              <span className="block text-4xs uppercase font-bold text-slate-400">Date Logged</span>
              <p className="font-semibold text-slate-700 mt-1">{formatDate(job.createdAt)}</p>
            </div>
            {job.siteAddress && (
              <div>
                <span className="block text-4xs uppercase font-bold text-slate-400">Site Address</span>
                <p className="font-semibold text-slate-700 mt-1">{job.siteAddress}</p>
              </div>
            )}
            {job.phoneNumber && (
              <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
                <span className="block text-4xs uppercase font-bold text-slate-400">Contact Number</span>
                <p className="font-semibold text-slate-700 mt-1">{job.phoneNumber}</p>
              </div>
            )}
            {job.notes && (
              <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
                <span className="block text-4xs uppercase font-bold text-slate-400">Notes / Instructions</span>
                <p className="font-semibold text-slate-700 mt-1 italic">"{job.notes.split('\n\n__TILES_DATA__')[0]}"</p>
              </div>
            )}
          </div>

          {/* Tiles Detailed Breakdown */}
          <div className="space-y-4">
            <h4 className="text-4xs uppercase font-black text-slate-400 tracking-wider">Measurements Breakdown</h4>
            {job.tiles && job.tiles.map((tile, tIdx) => (
              <div key={tile.id || tIdx} className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-2xs">
                {/* Tile Header */}
                <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-3xs">
                  <span className="font-extrabold text-slate-800">{tile.tileName || `Tile ${tIdx + 1}`}</span>
                  <span className="font-extrabold text-slate-900 bg-slate-200/60 px-3 py-1 rounded-sm border border-slate-200/80 text-4xs">
                    ₹{tile.ratePerSqft}/sq ft
                  </span>
                </div>
                {/* Rows */}
                <div className="p-4 space-y-2.5">
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-left border-collapse text-4xs min-w-[280px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-4xs">
                          <th className="pb-2">Location</th>
                          <th className="pb-2 text-center">Size (in)</th>
                          <th className="pb-2 text-center">Qty</th>
                          <th className="pb-2 text-right hidden sm:table-cell">Rounded (ft)</th>
                          <th className="pb-2 text-right">Area</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {tile.rows.map((row, rIdx) => (
                          <tr key={row.id || rIdx}>
                            <td className="py-2 text-slate-655 font-bold max-w-[100px] truncate sm:max-w-none" title={row.location || 'N/A'}>
                              {row.location || 'N/A'}
                            </td>
                            <td className="py-2 text-center whitespace-nowrap">
                              <div>{row.lengthInches}" x {row.widthInches}"</div>
                              <div className="text-4xs text-slate-400 font-medium sm:hidden mt-0.5">
                                R: {row.roundedLengthFt.toFixed(2)} x {row.roundedWidthFt.toFixed(2)} ft
                              </div>
                            </td>
                            <td className="py-2 text-center font-bold">{row.quantity}</td>
                            <td className="py-2 text-right text-slate-500 hidden sm:table-cell whitespace-nowrap">{row.roundedLengthFt.toFixed(2)} x {row.roundedWidthFt.toFixed(2)}</td>
                            <td className="py-2 text-right font-bold text-slate-900 whitespace-nowrap">{row.totalArea.toFixed(2)} sq ft</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200 text-slate-800 font-extrabold text-4xs">
                          <td className="py-2 text-slate-750 font-bold" colSpan={2}>Group Total:</td>
                          <td className="py-2 text-center">{tile.totalQuantity || tile.rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)}</td>
                          <td className="py-2 hidden sm:table-cell"></td>
                          <td className="py-2 text-right whitespace-nowrap">{tile.totalArea.toFixed(2)} sq ft</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-4xs font-bold text-slate-900 border-t border-slate-100 pt-2.5 mt-1 gap-1">
                    <span className="text-slate-500 font-medium">Tile Summary:</span>
                    <span>{tile.totalQuantity || tile.rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)} pcs &bull; {tile.totalArea.toFixed(2)} sq ft &bull; <span className="text-primary font-black">{formatCurrency(tile.subtotal)}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Summary */}
          <div className="bg-slate-55 border border-slate-200 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center text-4xs font-bold text-slate-800 gap-3">
            <div className="flex flex-col sm:flex-row sm:space-x-5 gap-1.5 sm:gap-0">
              <div>
                <span className="text-slate-400 text-4xs uppercase font-bold block">Grand Qty</span>
                <span className="font-extrabold text-slate-900 text-3xs">{job.totalQuantity || job.tiles.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)} pcs</span>
              </div>
              <div className="sm:border-l sm:border-slate-200 sm:pl-5">
                <span className="text-slate-400 text-4xs uppercase font-bold block">Grand Area</span>
                <span className="font-extrabold text-slate-900 text-3xs">{job.totalArea.toFixed(2)} sq ft</span>
              </div>
            </div>
            <div className="w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-200 flex justify-between sm:block">
              <span className="text-slate-400 text-4xs uppercase font-bold block sm:hidden">Total Cost</span>
              <span className="text-primary text-xs font-black">{formatCurrency(job.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center space-x-3 pt-3.5 border-t border-slate-200 flex-shrink-0">
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center space-x-1.5 bg-primary hover:opacity-90 active:opacity-95 text-white font-bold px-5 py-3 rounded-sm text-4xs cursor-pointer shadow-md transition-all w-full sm:w-auto text-center"
          >
            <Printer size={10} />
            <span>Print Estimate</span>
          </button>
          <button 
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-350 text-slate-800 font-bold px-5 py-3 rounded-sm text-4xs cursor-pointer shadow-sm transition-all w-full sm:w-auto text-center"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
