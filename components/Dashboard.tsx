'use client';

import { useJobStore, Job } from '@/store/store';
import { 
  Calculator, 
  History, 
  Scissors, 
  User, 
  Clock, 
  ChevronRight, 
  PlusCircle, 
  FileText,
  AlertCircle,
  PlayCircle,
  Briefcase
} from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
  user: any;
}

export default function Dashboard({ setCurrentTab, user }: DashboardProps) {
  const jobs = useJobStore((state) => state.jobs);
  const resetActiveJob = useJobStore((state) => state.resetActiveJob);

  // Filter jobs by progress
  const activeJobs = jobs.filter((job) => job.status === 'pending');
  
  // Filter jobs by fabrication/cutting status
  const ongoingCutting = jobs.filter((job) => job.cuttingStatus === 'ongoing');
  const pendingCutting = jobs.filter((job) => job.cuttingStatus === 'pending');
  const activeCuttingJobs = [...ongoingCutting, ...pendingCutting];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const startNewJob = () => {
    resetActiveJob();
    setCurrentTab('calculator');
  };

  const quickActions = [
    {
      id: 'calculator',
      name: 'New Calculator',
      description: 'Start a new tile measurement estimate',
      icon: Calculator,
      color: 'bg-primary/10 text-primary border-primary/20',
      action: startNewJob
    },
    {
      id: 'history',
      name: 'Job Estimates',
      description: 'View and manage previous client estimates',
      icon: History,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      action: () => setCurrentTab('history')
    },
    {
      id: 'cutlist',
      name: 'Fabrication Cut Lists',
      description: 'Track shop floor cutting status & progress',
      icon: Scissors,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      action: () => setCurrentTab('cutlist')
    },
    {
      id: 'profile',
      name: 'Profile & Themes',
      description: 'Update business info and hex accent color',
      icon: User,
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      action: () => setCurrentTab('profile')
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Welcome, <span className="text-primary">{user?.user_metadata?.business_name || 'Yash Marble'}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Logged in as <span className="font-bold text-slate-700">{user?.email}</span> | Manage estimates and shop floor operations.
          </p>
        </div>
        <button
          onClick={startNewJob}
          className="flex items-center space-x-2 bg-primary hover:opacity-90 active:opacity-95 text-white font-semibold px-4 py-2.5 rounded-sm shadow-md text-sm transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <PlusCircle size={18} />
          <span>New Estimate</span>
        </button>
      </div>

      {/* Quick Access Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider pl-2 border-l-2 border-primary">
          Quick Access Workspace
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={act.action}
                className="flex flex-col items-start p-4 bg-white border border-slate-200 hover:border-slate-350 rounded-sm shadow-xs hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
              >
                <div className={`p-2 rounded-sm border ${act.color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mt-4 group-hover:text-primary transition-colors">
                  {act.name}
                </h3>
                <p className="text-2xs text-slate-450 mt-1 line-clamp-2">
                  {act.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Columns: Left (Active Cutting) | Right (Active Jobs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Column 1: Active Cutting / Fabrication */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Scissors className="text-primary" size={18} />
              <span>Active Cutting Progress</span>
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-slate-100 text-slate-800">
              {activeCuttingJobs.length} In Progress
            </span>
          </div>

          {activeCuttingJobs.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <Clock size={36} className="stroke-1 mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No fabrication jobs active right now.</p>
              <button 
                onClick={() => setCurrentTab('cutlist')} 
                className="mt-2 text-2xs text-primary font-bold hover:underline"
              >
                Go to Cut Lists to queue a job
              </button>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {activeCuttingJobs.slice(0, 6).map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 border border-slate-150 rounded-sm hover:border-slate-300 transition-all bg-slate-50/50"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-slate-900 truncate">{job.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold truncate">({job.projectName})</span>
                    </div>
                    <p className="text-3xs text-slate-400 truncate mt-0.5">Site: {job.siteAddress || 'No Address'}</p>
                    <div className="flex items-center space-x-3 mt-1.5 text-3xs font-semibold text-slate-500">
                      <span>Area: {job.totalArea.toFixed(1)} sq ft</span>
                      <span>•</span>
                      <span>Tiles: {job.tiles.length} groups</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {job.cuttingStatus === 'ongoing' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-sm text-[9px] font-bold bg-amber-100 border border-amber-250 text-amber-800 animate-pulse">
                        <PlayCircle size={10} />
                        <span>Cutting</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold bg-slate-150 text-slate-600 border border-slate-200">
                        Queued
                      </span>
                    )}
                    <button 
                      onClick={() => setCurrentTab('cutlist')} 
                      className="block text-3xs text-primary font-bold mt-2 hover:underline cursor-pointer"
                    >
                      Update Progress
                    </button>
                  </div>
                </div>
              ))}
              {activeCuttingJobs.length > 6 && (
                <button
                  onClick={() => setCurrentTab('cutlist')}
                  className="w-full text-center text-2xs font-extrabold text-primary hover:underline pt-1 cursor-pointer"
                >
                  View all active cutting jobs ({activeCuttingJobs.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Column 2: Active / Recent Job Estimates */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Briefcase className="text-primary" size={18} />
              <span>Active Job Estimates</span>
            </h2>
            <button 
              onClick={() => setCurrentTab('history')}
              className="text-xs text-primary hover:opacity-85 font-bold flex items-center space-x-0.5 cursor-pointer"
            >
              <span>View History</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {activeJobs.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <FileText size={36} className="stroke-1 mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No pending job estimates.</p>
              <button 
                onClick={startNewJob} 
                className="mt-2 text-2xs text-primary font-bold hover:underline"
              >
                Create new estimate
              </button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              {/* Desktop view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-2.5 w-1/3">Customer</th>
                      <th className="pb-2.5">Project</th>
                      <th className="pb-2.5 text-right">Area</th>
                      <th className="pb-2.5 text-right pl-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {activeJobs.slice(0, 5).map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 pr-2">
                          <p className="font-extrabold text-slate-900 truncate max-w-[150px]">{job.customerName}</p>
                          <p className="text-3xs text-slate-450 mt-0.5">{job.phoneNumber || 'No phone'}</p>
                        </td>
                        <td className="py-2.5 text-slate-650 truncate max-w-[120px]">{job.projectName}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">{job.totalArea.toFixed(1)} sq ft</td>
                        <td className="py-2.5 text-right font-extrabold text-primary pl-4">{formatCurrency(job.grandTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view */}
              <div className="sm:hidden space-y-2.5">
                {activeJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border border-slate-150 rounded-sm">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-extrabold text-xs text-slate-900 truncate">{job.customerName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{job.projectName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-primary">{formatCurrency(job.grandTotal)}</p>
                      <p className="text-3xs text-slate-400 font-medium">{job.totalArea.toFixed(1)} sq ft</p>
                    </div>
                  </div>
                ))}
              </div>

              {activeJobs.length > 5 && (
                <div className="border-t border-slate-100 pt-3 mt-3">
                  <button
                    onClick={() => setCurrentTab('history')}
                    className="w-full text-center text-2xs font-extrabold text-primary hover:underline cursor-pointer"
                  >
                    View all active jobs ({activeJobs.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
