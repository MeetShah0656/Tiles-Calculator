'use client';

import { useJobStore } from '@/store/store';
import { Scissors, Printer, ClipboardCheck, Sparkles, FolderOpen } from 'lucide-react';

export default function CutListTab() {
  const activeJob = useJobStore((state) => state.activeJob);

  const getGroupedCutListByTile = () => {
    return activeJob.tiles.map((tile) => {
      const map: Record<string, { length: string; width: string; quantity: number; roundedLength: number; roundedWidth: number; totalArea: number }> = {};

      tile.rows.forEach((row) => {
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

      return {
        tileId: tile.id,
        tileName: tile.tileName || 'Unnamed Tile Group',
        ratePerSqft: tile.ratePerSqft,
        cuts: Object.values(map),
        totalPieces: tile.rows.reduce((sum, r) => sum + (r.lengthInches && r.widthInches ? r.quantity : 0), 0)
      };
    }).filter(group => group.cuts.length > 0);
  };

  const groupedCuts = getGroupedCutListByTile();
  const grandTotalPieces = groupedCuts.reduce((sum, g) => sum + g.totalPieces, 0);

  const handlePrintCutList = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Fabrication Cut List
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Identical pieces are automatically grouped to optimize fabrication and cutting workflow.
          </p>
        </div>
        {grandTotalPieces > 0 && (
          <button
            onClick={handlePrintCutList}
            className="flex items-center space-x-2 bg-primary hover:opacity-90 active:opacity-95 text-white font-semibold px-4 py-2.5 rounded-sm shadow-md shadow-primary/10 text-sm transition-all cursor-pointer"
          >
            <Printer size={18} />
            <span>Print Cut List</span>
          </button>
        )}
      </div>

      {/* Active job details summary */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Current active job draft</span>
          <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
            {activeJob.customerName || 'Draft Job'} &mdash; <span className="text-primary font-bold">{activeJob.projectName || 'Draft Project'}</span>
          </h2>
        </div>
        <div className="text-right sm:text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total pieces to cut</span>
          <p className="text-lg font-black text-primary">
            {grandTotalPieces} pcs
          </p>
        </div>
      </div>

      {/* Cut List Content */}
      {groupedCuts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-sm border border-slate-200">
          <Scissors size={48} className="stroke-1 text-slate-500 mb-2" />
          <p className="text-sm font-semibold">Cut list is empty</p>
          <p className="text-xs text-slate-500 mt-1">Add valid measurements (length and width in inches) in the calculator.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedCuts.map((tileGroup, idx) => (
            <div key={tileGroup.tileId || idx} className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200">
                <FolderOpen className="text-primary" size={20} />
                <span className="font-extrabold text-slate-900">{tileGroup.tileName}</span>
                <span className="text-2xs bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-sm font-bold">
                  {tileGroup.totalPieces} pieces
                </span>
              </div>

              <div className="space-y-3">
                {tileGroup.cuts.map((item, cIdx) => (
                  <div 
                    key={cIdx}
                    className="flex items-center justify-between p-3.5 rounded-sm bg-white border border-slate-200 hover:border-primary/20 transition-all group"
                  >
                    {/* Dimensions Display */}
                    <div>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-base font-black text-slate-900">
                          {Number(item.length).toFixed(2)}"
                        </span>
                        <span className="text-xs font-semibold text-slate-400">x</span>
                        <span className="text-base font-black text-slate-900">
                          {Number(item.width).toFixed(2)}"
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-semibold">
                        <Sparkles size={10} className="text-primary" />
                        <span>Rounded: {item.roundedLength.toFixed(2)} ft x {item.roundedWidth.toFixed(2)} ft</span>
                      </div>
                    </div>

                    {/* Quantity Badge */}
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-sm text-center min-w-[70px]">
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-primary/70">Qty</span>
                        <span className="text-base font-extrabold">{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

