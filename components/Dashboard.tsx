'use client';

import { useJobStore } from '@/store/store';
import { 
  Briefcase, 
  TrendingUp, 
  Layers, 
  CalendarDays, 
  Clock, 
  UserPlus, 
  ChevronRight, 
  PlusCircle, 
  FileText 
} from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
  user: any;
}

export default function Dashboard({ setCurrentTab, user }: DashboardProps) {
  const jobs = useJobStore((state) => state.jobs);
  const resetActiveJob = useJobStore((state) => state.resetActiveJob);

  // Statistics calculation
  const totalJobs = jobs.length;
  const totalArea = jobs.reduce((sum, job) => sum + job.totalArea, 0);
  const totalRevenue = jobs.reduce((sum, job) => sum + job.grandTotal, 0);

  // Today's jobs
  const today = new Date().toISOString().split('T')[0];
  const todaysJobs = jobs.filter((job) => job.createdAt.startsWith(today));
  const todaysArea = todaysJobs.reduce((sum, job) => sum + job.totalArea, 0);
  const todaysRevenue = todaysJobs.reduce((sum, job) => sum + job.grandTotal, 0);

  // Monthly revenue
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthlyJobs = jobs.filter((job) => job.createdAt.startsWith(thisMonth));
  const monthlyRevenue = monthlyJobs.reduce((sum, job) => sum + job.grandTotal, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const startNewJob = () => {
    resetActiveJob();
    setCurrentTab('calculator');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome, <span className="text-primary">{user?.user_metadata?.business_name || 'Yash Marble'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time shop calculations and client project sheets overview.
          </p>
        </div>
        <button
          onClick={startNewJob}
          className="flex items-center space-x-2 bg-primary hover:opacity-90 active:opacity-95 text-white font-semibold px-4 py-2.5 rounded-sm shadow-md shadow-primary/10 text-sm transition-all cursor-pointer"
        >
          <PlusCircle size={18} />
          <span>New Measurement</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-sm p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Jobs</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalJobs}</p>
          </div>
        </div>

        {/* Total Area Sold */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-sm p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Layers size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Area Fabricated</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalArea.toFixed(2)} <span className="text-sm font-normal text-slate-500">sq ft</span>
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-sm p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Business</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-sm p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <CalendarDays size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">This Month</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(monthlyRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <Clock className="text-primary" size={18} />
            <span>Today's Work Summary</span>
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3.5 rounded-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Jobs Logged</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{todaysJobs.length}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 rounded-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Fabricated Area</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{todaysArea.toFixed(2)} sq ft</span>
            </div>
            <div className="flex justify-between items-center p-3.5 rounded-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estimated value</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(todaysRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Recent Customers List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <UserPlus className="text-primary" size={18} />
              <span>Recent Customers & Jobs</span>
            </h2>
            <button 
              onClick={() => setCurrentTab('history')}
              className="text-xs text-primary hover:opacity-80 font-semibold flex items-center space-x-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText size={40} className="stroke-1 text-slate-550 mb-2" />
                <p className="text-sm">No job entries yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 px-4">Project</th>
                    <th className="pb-3 px-4 text-right">Area (sq ft)</th>
                    <th className="pb-3 pl-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                  {jobs.slice(0, 5).map((job) => (
                    <tr key={job.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{job.customerName}</p>
                        <p className="text-2xs text-slate-400 mt-0.5">{job.phoneNumber || 'No phone'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {job.projectName}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-right text-slate-900 dark:text-white font-medium">
                        {job.totalArea.toFixed(2)}
                      </td>
                      <td className="py-3.5 pl-4 text-sm text-right text-primary font-semibold">
                        {formatCurrency(job.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
