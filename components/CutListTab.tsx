'use client';

import { useJobStore, MeasurementRow } from '@/store/store';
import { Scissors, Printer, ClipboardCheck, Sparkles, FolderOpen, User, Activity } from 'lucide-react';

export default function CutListTab() {
  const { activeJob, jobs, updateJobCuttingStatus } = useJobStore();

  const getJobCuts = (jobId: string, jobName: string, projectName: string, tiles: any[], cuttingStatus: string) => {
    const tileCuts = tiles.map((tile) => {
      const map: Record<string, { length: string; width: string; quantity: number; roundedLength: number; roundedWidth: number; totalArea: number }> = {};

      tile.rows.forEach((row: MeasurementRow) => {
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
        totalPieces: tile.rows.reduce((sum: number, r: MeasurementRow) => sum + (r.lengthInches && r.widthInches ? r.quantity : 0), 0)
      };
    }).filter(group => group.cuts.length > 0);

    return {
      jobId,
      jobName,
      projectName,
      cuttingStatus,
      tileCuts,
      totalPieces: tileCuts.reduce((sum, t) => sum + t.totalPieces, 0)
    };
  };

  const activeJobCuts = getJobCuts(
    'draft',
    activeJob.customerName || 'Draft Job',
    activeJob.projectName || 'Draft Project',
    activeJob.tiles,
    'draft'
  );

  const savedJobsCuts = jobs
    .filter((job) => (job.cuttingStatus === 'pending' || job.cuttingStatus === 'ongoing'))
    .map((job) => getJobCuts(job.id, job.customerName, job.projectName, job.tiles, job.cuttingStatus || 'pending'))
    .filter((jc) => jc.totalPieces > 0);

  const allJobCuts = [
    ...(activeJobCuts.totalPieces > 0 ? [activeJobCuts] : []),
    ...savedJobsCuts
  ];

  const grandTotalPieces = allJobCuts.reduce((sum, jc) => sum + jc.totalPieces, 0);

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
            Active jobs in cutting are displayed here. Change status to "done" in history to clear from checklist.
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

      {/* active job details summary */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Cutting Checklist Summary</span>
          <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
            Active Jobs for Fabrication
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
      {allJobCuts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-sm border border-slate-200">
          <Scissors size={48} className="stroke-1 text-slate-500 mb-2" />
          <p className="text-sm font-semibold">No active cutting items</p>
          <p className="text-xs text-slate-500 mt-1">Save a job with "pending" or "ongoing" cutting status to see checklist items.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {allJobCuts.map((jobCut, jIdx) => (
            <div key={jIdx} className="bg-slate-50/50 border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm space-y-4">
              {/* Job Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Client / Project</span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center space-x-2">
                    <User size={15} className="text-primary" />
                    <span>{jobCut.jobName} &mdash; <span className="text-primary">{jobCut.projectName}</span></span>
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {jobCut.jobId !== 'draft' && (
                    <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-sm px-2.5 py-1.5 shadow-2xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase">Fabrication Status:</span>
                      <select
                        value={jobCut.cuttingStatus}
                        onChange={(e) => updateJobCuttingStatus(jobCut.jobId, e.target.value as 'pending' | 'ongoing' | 'done')}
                        className="text-[9px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 focus:outline-none cursor-pointer uppercase"
                      >
                        <option value="pending">Queued / Pending</option>
                        <option value="ongoing">Ongoing Cutting</option>
                        <option value="done">Completed / Done</option>
                      </select>
                    </div>
                  )}
                  {jobCut.jobId === 'draft' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border bg-slate-100 text-slate-650 border-slate-300">
                      Current Draft
                    </span>
                  )}
                  <span className="text-2xs bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-sm font-bold">
                    {jobCut.totalPieces} pieces
                  </span>
                </div>
              </div>

              {/* Tiles inside the Job */}
              <div className="space-y-6">
                {jobCut.tileCuts.map((tileGroup, idx) => (
                  <div key={tileGroup.tileId || idx} className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-150">
                      <FolderOpen className="text-primary" size={16} />
                      <span className="font-extrabold text-sm text-slate-800">{tileGroup.tileName}</span>
                      <span className="text-3xs bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-sm font-bold">
                        {tileGroup.totalPieces} pcs
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {tileGroup.cuts.map((item, cIdx) => (
                        <div 
                          key={cIdx}
                          className="flex items-center justify-between p-3 rounded-sm bg-white border border-slate-150 hover:border-primary/20 transition-all group"
                        >
                          {/* Dimensions Display */}
                          <div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-sm font-black text-slate-900">
                                {Number(item.length).toFixed(2)}"
                              </span>
                              <span className="text-3xs font-semibold text-slate-400">x</span>
                              <span className="text-sm font-black text-slate-900">
                                {Number(item.width).toFixed(2)}"
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-0.5 text-[9px] text-slate-500 font-semibold">
                              <Sparkles size={8} className="text-primary" />
                              <span>Rounded: {item.roundedLength.toFixed(2)} ft x {item.roundedWidth.toFixed(2)} ft</span>
                            </div>
                          </div>

                          {/* Quantity Badge */}
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/5 text-primary px-3 py-1 rounded-sm text-center min-w-[60px]">
                              <span className="block text-[8px] uppercase font-extrabold tracking-wider text-primary/70">Qty</span>
                              <span className="text-sm font-extrabold">{item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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


