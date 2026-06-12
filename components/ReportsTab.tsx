'use client';

import { useJobStore } from '@/store/store';
import { 
  FileBarChart2, 
  Calendar, 
  User, 
  Layers, 
  TrendingUp, 
  BarChart4,
  ArrowUpRight 
} from 'lucide-react';
import { useState } from 'react';

export default function ReportsTab() {
  const { jobs } = useJobStore();
  const [activeReport, setActiveReport] = useState<'daily' | 'monthly' | 'customer'>('daily');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // 1. Daily Reports Calculation
  const getDailyReportData = () => {
    const dailyMap: Record<string, { count: number; area: number; revenue: number }> = {};
    
    jobs.forEach((job) => {
      const date = job.createdAt.split('T')[0];
      if (dailyMap[date]) {
        dailyMap[date].count += 1;
        dailyMap[date].area += job.totalArea;
        dailyMap[date].revenue += job.grandTotal;
      } else {
        dailyMap[date] = {
          count: 1,
          area: job.totalArea,
          revenue: job.grandTotal
        };
      }
    });

    return Object.entries(dailyMap).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => b.date.localeCompare(a.date));
  };

  // 2. Monthly Reports Calculation
  const getMonthlyReportData = () => {
    const monthlyMap: Record<string, { count: number; area: number; revenue: number }> = {};
    
    jobs.forEach((job) => {
      const month = job.createdAt.substring(0, 7); // YYYY-MM
      if (monthlyMap[month]) {
        monthlyMap[month].count += 1;
        monthlyMap[month].area += job.totalArea;
        monthlyMap[month].revenue += job.grandTotal;
      } else {
        monthlyMap[month] = {
          count: 1,
          area: job.totalArea,
          revenue: job.grandTotal
        };
      }
    });

    return Object.entries(monthlyMap).map(([month, stats]) => ({
      month,
      ...stats
    })).sort((a, b) => b.month.localeCompare(a.month));
  };

  // 3. Customer Reports Calculation
  const getCustomerReportData = () => {
    const customerMap: Record<string, { jobsCount: number; area: number; revenue: number; phone: string }> = {};
    
    jobs.forEach((job) => {
      const name = job.customerName.trim();
      if (!name) return;
      
      if (customerMap[name]) {
        customerMap[name].jobsCount += 1;
        customerMap[name].area += job.totalArea;
        customerMap[name].revenue += job.grandTotal;
      } else {
        customerMap[name] = {
          jobsCount: 1,
          area: job.totalArea,
          revenue: job.grandTotal,
          phone: job.phoneNumber
        };
      }
    });

    return Object.entries(customerMap).map(([name, stats]) => ({
      name,
      ...stats
    })).sort((a, b) => b.revenue - a.revenue); // Rank by spend
  };

  const dailyData = getDailyReportData();
  const monthlyData = getMonthlyReportData();
  const customerData = getCustomerReportData();

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Business Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Perform reviews of fabricated area, completed invoices, and client billing logs.
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="flex rounded-sm bg-white p-1 border border-slate-200 max-w-md">
        <button
          onClick={() => setActiveReport('daily')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-semibold rounded-sm transition-all ${
            activeReport === 'daily' 
              ? 'bg-slate-100 text-primary shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={14} />
          <span>Daily Report</span>
        </button>
        <button
          onClick={() => setActiveReport('monthly')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-semibold rounded-sm transition-all ${
            activeReport === 'monthly' 
              ? 'bg-slate-100 text-primary shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart4 size={14} />
          <span>Monthly Report</span>
        </button>
        <button
          onClick={() => setActiveReport('customer')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-semibold rounded-sm transition-all ${
            activeReport === 'customer' 
              ? 'bg-slate-100 text-primary shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={14} />
          <span>Customer Report</span>
        </button>
      </div>

      {/* Daily Report View */}
      {activeReport === 'daily' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="text-primary" size={18} />
            <span className="font-bold text-slate-900">Daily Job Statistics</span>
          </div>

          <div className="overflow-x-auto">
            {dailyData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No daily records found.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 px-4 text-center">Jobs Logged</th>
                    <th className="pb-3 px-4 text-right">Area Sold (sq ft)</th>
                    <th className="pb-3 pl-4 text-right">Est. Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyData.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50">
                      <td className="py-3.5 pr-4 text-sm font-semibold text-slate-900">
                        {new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-center font-medium text-slate-600">
                        {row.count}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-right font-medium text-slate-900">
                        {row.area.toFixed(2)}
                      </td>
                      <td className="py-3.5 pl-4 text-sm text-right text-primary font-bold">
                        {formatCurrency(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Monthly Report View */}
      {activeReport === 'monthly' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart4 className="text-primary" size={18} />
            <span className="font-bold text-slate-900">Monthly Revenue & Volume</span>
          </div>

          <div className="overflow-x-auto">
            {monthlyData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No monthly records found.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                    <th className="pb-3 pr-4">Month</th>
                    <th className="pb-3 px-4 text-center">Total Jobs</th>
                    <th className="pb-3 px-4 text-right">Area Sold (sq ft)</th>
                    <th className="pb-3 pl-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50">
                      <td className="py-3.5 pr-4 text-sm font-semibold text-slate-900">
                        {new Date(row.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-center font-medium text-slate-600">
                        {row.count}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-right font-medium text-slate-900">
                        {row.area.toFixed(2)}
                      </td>
                      <td className="py-3.5 pl-4 text-sm text-right text-primary font-bold">
                        {formatCurrency(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Customer Report View */}
      {activeReport === 'customer' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <User className="text-primary" size={18} />
            <span className="font-bold text-slate-900">Client Billing Rankings</span>
          </div>

          <div className="overflow-x-auto">
            {customerData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No customer logs recorded.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                    <th className="pb-3 pr-4">Customer Name</th>
                    <th className="pb-3 px-4 text-center">Jobs Ordered</th>
                    <th className="pb-3 px-4 text-right">Area Sold (sq ft)</th>
                    <th className="pb-3 pl-4 text-right">Total Billings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerData.map((row, idx) => (
                    <tr key={row.name} className="hover:bg-slate-50 group">
                      <td className="py-3.5 pr-4 flex items-center space-x-2.5">
                        <span className="text-2xs font-bold text-slate-450 bg-slate-50 w-5 h-5 rounded-sm flex items-center justify-center border border-slate-200">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                          <p className="text-3xs text-slate-500 mt-0.5">{row.phone || 'No phone number'}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-center font-medium text-slate-655">
                        {row.jobsCount}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-right font-medium text-slate-900">
                        {row.area.toFixed(2)}
                      </td>
                      <td className="py-3.5 pl-4 text-sm text-right text-primary font-bold">
                        <span className="flex items-center justify-end space-x-1">
                          <span>{formatCurrency(row.revenue)}</span>
                          <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
