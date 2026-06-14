'use client';

import { useJobStore, MeasurementRow, Job } from '@/store/store';
import { Scissors, Printer, ClipboardCheck, Sparkles, FolderOpen, User, Activity } from 'lucide-react';

interface CutListTabProps {
  onViewJob?: (job: Job) => void;
  jobViewModes?: Record<string, 'compact' | 'full'>;
  setJobViewModes?: React.Dispatch<React.SetStateAction<Record<string, 'compact' | 'full'>>>;
  onPrintSingleJob?: (jobId: string) => void;
}

export default function CutListTab({ onViewJob, jobViewModes, setJobViewModes, onPrintSingleJob }: CutListTabProps) {
  const { activeJob, jobs, updateJobCuttingStatus } = useJobStore();

  const getJobCuts = (jobId: string, jobName: string, projectName: string, tiles: any[], cuttingStatus: string, mode: 'compact' | 'full') => {
    const tileCuts = tiles.map((tile) => {
      let cuts: any[] = [];
      if (mode === 'compact') {
        const map: Record<string, { length: number; width: number; quantity: number; roundedLength: number; roundedWidth: number; locations: string[] }> = {};
        tile.rows.forEach((row: MeasurementRow) => {
          if (!row.lengthInches || !row.widthInches) return;
          const len = Number(row.lengthInches);
          const wid = Number(row.widthInches);
          const maxDim = Math.max(len, wid);
          const minDim = Math.min(len, wid);
          const key = `${maxDim.toFixed(2)}x${minDim.toFixed(2)}`;

          const rLen = row.roundedLengthFt || 0;
          const rWid = row.roundedWidthFt || 0;
          const maxRLen = Math.max(rLen, rWid);
          const minRLen = Math.min(rLen, rWid);

          if (map[key]) {
            map[key].quantity += Number(row.quantity) || 0;
            if (row.location) map[key].locations.push(row.location);
          } else {
            map[key] = {
              length: maxDim,
              width: minDim,
              quantity: Number(row.quantity) || 0,
              roundedLength: maxRLen,
              roundedWidth: minRLen,
              locations: row.location ? [row.location] : []
            };
          }
        });
        cuts = Object.values(map).map(c => ({
          length: c.length.toString(),
          width: c.width.toString(),
          quantity: c.quantity,
          roundedLength: c.roundedLength,
          roundedWidth: c.roundedWidth,
          location: Array.from(new Set(c.locations)).filter(Boolean).join(', ') || '-'
        }));
      } else {
        cuts = tile.rows.filter((row: MeasurementRow) => row.lengthInches && row.widthInches).map((row: MeasurementRow) => ({
          length: row.lengthInches,
          width: row.widthInches,
          quantity: Number(row.quantity) || 0,
          roundedLength: row.roundedLengthFt || 0,
          roundedWidth: row.roundedWidthFt || 0,
          location: row.location || '-'
        }));
      }

      return {
        tileId: tile.id,
        tileName: tile.tileName || 'Unnamed Tile Group',
        ratePerSqft: tile.ratePerSqft,
        cuts,
        totalPieces: cuts.reduce((sum, c) => sum + c.quantity, 0)
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
    'draft',
    (jobViewModes && jobViewModes['draft']) || 'compact'
  );

  const savedJobsCuts = jobs
    .filter((job) => (job.cuttingStatus === 'pending' || job.cuttingStatus === 'ongoing'))
    .map((job) => getJobCuts(job.id, job.customerName, job.projectName, job.tiles, job.cuttingStatus || 'pending', (jobViewModes && jobViewModes[job.id]) || 'compact'))
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div 
                  onClick={() => {
                    if (jobCut.jobId === 'draft') {
                      const draftJob: Job = {
                        ...activeJob,
                        id: 'draft',
                        createdAt: new Date().toISOString(),
                        syncStatus: 'pending_sync'
                      };
                      onViewJob?.(draftJob);
                    } else {
                      const savedJob = jobs.find(j => j.id === jobCut.jobId);
                      if (savedJob) onViewJob?.(savedJob);
                    }
                  }}
                  className="cursor-pointer hover:opacity-75 transition-opacity flex-grow"
                  title="Click to view details"
                >
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-450 hover:text-primary transition-colors flex items-center space-x-1">
                    <span>Client / Project</span>
                    <span className="text-[8px] font-normal lowercase italic text-slate-400">(click for details)</span>
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center space-x-2">
                    <User size={15} className="text-primary" />
                    <span>{jobCut.jobName} &mdash; <span className="text-primary">{jobCut.projectName}</span></span>
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {/* Compact / Full View Switcher */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-[9px] font-bold shadow-3xs">
                    <button
                      onClick={() => setJobViewModes?.(prev => ({ ...prev, [jobCut.jobId]: 'compact' }))}
                      className={`px-2.5 py-1 rounded-sm transition-all cursor-pointer ${
                        ((jobViewModes && jobViewModes[jobCut.jobId]) || 'compact') === 'compact'
                          ? 'bg-white text-primary shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Compact
                    </button>
                    <button
                      onClick={() => setJobViewModes?.(prev => ({ ...prev, [jobCut.jobId]: 'full' }))}
                      className={`px-2.5 py-1 rounded-sm transition-all cursor-pointer ${
                        ((jobViewModes && jobViewModes[jobCut.jobId]) || 'compact') === 'full'
                          ? 'bg-white text-primary shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Full
                    </button>
                  </div>

                  {/* Individual Print Button */}
                  <button
                    onClick={() => onPrintSingleJob?.(jobCut.jobId)}
                    className="flex items-center justify-center p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-primary rounded shadow-3xs transition-all cursor-pointer"
                    title="Print This Job"
                  >
                    <Printer size={13} />
                  </button>

                  {jobCut.jobId !== 'draft' && (
                    <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded px-2.5 py-1 shadow-3xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase">Status:</span>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-100 text-slate-650 border-slate-300">
                      Current Draft
                    </span>
                  )}
                  <span className="text-2xs bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold shadow-3xs">
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
                      <span className="text-3xs bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                        {tileGroup.totalPieces} pcs
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {tileGroup.cuts.map((item, cIdx) => (
                        <div 
                          key={cIdx}
                          className="flex items-center justify-between p-3 rounded bg-white border border-slate-150 hover:border-primary/20 transition-all group"
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
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-slate-500 font-semibold">
                              <span className="bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm text-[8px] font-bold">
                                {item.location || '-'}
                              </span>
                              <span className="text-slate-300">&bull;</span>
                              <Sparkles size={8} className="text-primary" />
                              <span>Rounded: {item.roundedLength.toFixed(2)} ft x {item.roundedWidth.toFixed(2)} ft</span>
                            </div>
                          </div>

                          {/* Quantity Badge */}
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/5 text-primary px-3 py-1 rounded text-center min-w-[60px]">
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


