'use client';

import { useJobStore } from '@/store/store';
import { Scissors, Printer, ClipboardCheck, Sparkles } from 'lucide-react';

export default function CutListTab() {
  const activeJob = useJobStore((state) => state.activeJob);

  // Group rows by "Length x Width" in inches
  const getAggregatedCutList = () => {
    const map: Record<string, { length: string; width: string; quantity: number; roundedLength: number; roundedWidth: number; totalArea: number }> = {};

    activeJob.rows.forEach((row) => {
      if (!row.lengthInches || !row.widthInches) return;
      
      const key = `${Number(row.lengthInches).toFixed(2)}x${Number(row.widthInches).toFixed(2)}`;
      
      if (map[key]) {
        map[key].quantity += row.quantity;
      } else {
        map[key] = {
          length: row.lengthInches,
          width: row.widthInches,
          quantity: row.quantity,
          roundedLength: row.roundedLengthFt,
          roundedWidth: row.roundedWidthFt,
          totalArea: row.totalArea
        };
      }
    });

    return Object.values(map);
  };

  const cutList = getAggregatedCutList();

  const handlePrintCutList = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fabrication Cut List
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Identical pieces are automatically grouped to optimize fabrication and cutting workflow.
          </p>
        </div>
        {cutList.length > 0 && (
          <button
            onClick={handlePrintCutList}
            className="flex items-center space-x-2 bg-primary hover:opacity-90 active:opacity-95 text-white font-semibold px-4 py-2.5 rounded-sm shadow-md shadow-primary/10 text-sm transition-all cursor-pointer"
          >
            <Printer size={18} />
            <span>Print Cut List</span>
          </button>
        )}
      </div>

      {/* active job details summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Current active job draft</span>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            {activeJob.customerName || 'Draft Job'} &mdash; <span className="text-primary font-bold">{activeJob.projectName || 'Draft Project'}</span>
          </h2>
        </div>
        <div className="text-right sm:text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total pieces to cut</span>
          <p className="text-lg font-black text-primary">
            {activeJob.rows.reduce((sum, r) => sum + (r.lengthInches && r.widthInches ? r.quantity : 0), 0)} pcs
          </p>
        </div>
      </div>

      {/* Cut List Content */}
      {cutList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-850">
          <Scissors size={48} className="stroke-1 text-slate-500 mb-2" />
          <p className="text-sm font-semibold">Cut list is empty</p>
          <p className="text-xs text-slate-500 mt-1">Add valid measurements (length and width in inches) in the calculator.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-6 pb-3 border-b border-slate-200 dark:border-slate-850">
            <ClipboardCheck className="text-primary" size={20} />
            <span className="font-bold text-slate-900 dark:text-white">Cutting Checklist</span>
          </div>

          <div className="space-y-4">
            {cutList.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-4 rounded-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 hover:border-primary/25 transition-all group"
              >
                {/* Dimensions Display */}
                <div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {Number(item.length).toFixed(2)}"
                    </span>
                    <span className="text-xs font-semibold text-slate-400">x</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {Number(item.width).toFixed(2)}"
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-2xs text-slate-500 font-semibold">
                    <Sparkles size={10} className="text-primary" />
                    <span>Rounded Footprint: {item.roundedLength.toFixed(2)} ft x {item.roundedWidth.toFixed(2)} ft</span>
                  </div>
                </div>

                {/* Quantity Badge */}
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 dark:bg-primary/20 text-primary px-4 py-2 rounded-sm text-center min-w-[80px]">
                    <span className="block text-[10px] uppercase font-bold tracking-wider">Quantity</span>
                    <span className="text-lg font-extrabold">{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
