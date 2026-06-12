'use client';

import { useJobStore, Job } from '@/store/store';
import { 
  Search, 
  Trash2, 
  Copy, 
  Edit3, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useState } from 'react';

interface JobHistoryProps {
  setCurrentTab: (tab: string) => void;
}

export default function JobHistory({ setCurrentTab }: JobHistoryProps) {
  const { jobs, loadJob, deleteJob, duplicateJob, updateJobCuttingStatus } = useJobStore();
  const [search, setSearch] = useState('');
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});

  const toggleJobExpand = (jobId: string) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const filteredJobs = jobs.filter((job) => {
    const query = search.toLowerCase();
    return (
      job.customerName.toLowerCase().includes(query) ||
      job.projectName.toLowerCase().includes(query) ||
      (job.siteAddress && job.siteAddress.toLowerCase().includes(query))
    );
  });

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = (id: string) => {
    loadJob(id);
    setCurrentTab('calculator');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Job History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, edit, duplicate, and monitor cloud sync status of all saved measurement jobs.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, project description, address..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none shadow-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {/* Job Grid/List */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-sm border border-slate-200">
          <FileSpreadsheet size={48} className="stroke-1 text-slate-500 mb-2" />
          <p className="text-sm font-bold">No records found</p>
          <p className="text-xs text-slate-500 mt-1">Try entering another search criteria or save a new calculator sheet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const isExpanded = !!expandedJobs[job.id];
            return (
              <div 
                key={job.id} 
                className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer"
                onClick={() => toggleJobExpand(job.id)}
              >
                {/* Sync Status Badge */}
                <div className="absolute top-4 right-4 flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                  {job.syncStatus === 'synced' ? (
                    <span className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                      <CheckCircle size={10} />
                      <span>Cloud Synced</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-sm">
                      <AlertCircle size={10} />
                      <span>Local Only</span>
                    </span>
                  )}
                </div>

                {/* Main Content */}
                <div>
                  <div className="flex items-center space-x-1.5 text-2xs text-slate-400 font-semibold mb-2">
                    <Clock size={12} />
                    <span>{formatDate(job.createdAt)}</span>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {job.customerName}
                  </h3>
                  <h4 className="text-sm text-slate-655 font-semibold mt-1">
                    {job.projectName}
                  </h4>

                  {job.siteAddress && (
                    <div className="flex items-start space-x-1 text-xs text-slate-500 mt-3">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{job.siteAddress}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Area Sold</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {job.totalArea.toFixed(2)} sq ft
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Cost Amount</span>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {formatCurrency(job.grandTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Tile Tags */}
                  {job.tiles && job.tiles.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {job.tiles.map((tile, idx) => (
                        <span key={tile.id || idx} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-sm border border-slate-200 font-bold">
                          {tile.tileName || `Tile ${idx + 1}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {job.notes && (
                    <p className="text-2xs text-slate-500 mt-3 italic line-clamp-2 bg-slate-55 p-2 rounded-sm border border-slate-200">
                      "{job.notes.split('\n\n__TILES_DATA__')[0]}"
                    </p>
                  )}

                  {/* Cutting Status Select */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cutting Status</span>
                    <div className="inline-flex rounded-sm border border-slate-200 p-0.5 bg-slate-50">
                      {(['pending', 'ongoing', 'done'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateJobCuttingStatus(job.id, status);
                          }}
                          className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                            (job.cuttingStatus || 'pending') === status
                              ? status === 'pending'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : status === 'ongoing'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Detailed Calculations */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-fadeIn text-left cursor-default" onClick={(e) => e.stopPropagation()}>
                      <h5 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Detailed Calculations</h5>
                      {job.tiles && job.tiles.map((tile, tIdx) => (
                        <div key={tile.id || tIdx} className="bg-slate-50 p-3 rounded-sm border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-150 pb-1.5">
                            <span className="text-xs font-black text-slate-800">{tile.tileName || `Tile ${tIdx + 1}`}</span>
                            <span className="text-3xs font-extrabold text-slate-550 bg-slate-200 px-2 py-0.5 rounded-sm">
                              ₹{tile.ratePerSqft}/sq ft
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {tile.rows.map((row, rIdx) => (
                              <div key={row.id || rIdx} className="flex justify-between text-[11px] font-semibold text-slate-600">
                                <span>
                                  {row.location ? `[${row.location}] ` : ''}
                                  {row.lengthInches}" x {row.widthInches}" ({row.quantity} pcs)
                                </span>
                                <span className="font-extrabold text-slate-800">
                                  {row.totalArea.toFixed(2)} sq ft
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[11px] font-black text-slate-900 border-t border-slate-150 pt-1.5">
                            <span>Subtotal</span>
                            <span>{tile.totalArea.toFixed(2)} sq ft &bull; {formatCurrency(tile.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Grid */}
                <div className="flex justify-end space-x-1.5 mt-5 pt-3 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(job.id);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-sm text-xs font-semibold text-primary hover:opacity-80 transition-colors border border-primary/20 cursor-pointer"
                    title="Open in Calculator"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateJob(job.id);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-sm text-xs font-semibold text-slate-600 hover:bg-slate-55 transition-colors border border-slate-200 cursor-pointer"
                    title="Duplicate entire job"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteJob(job.id);
                    }}
                    className="flex items-center space-x-1 px-2 py-1.5 rounded-sm text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors border border-rose-500/10 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
