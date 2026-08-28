'use client';

import { useJobStore } from '@/store/store.js';
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
  const jobs = useJobStore((state) => state.jobs || []);
  const [activeReport, setActiveReport] = useState('daily');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getDailyReportData = () => {
    const dailyMap = {};
    
    jobs.forEach((job) => {
      const date = (job.createdAt || new Date().toISOString()).split('T')[0];
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

  const getMonthlyReportData = () => {
    const monthlyMap = {};
    
    jobs.forEach((job) => {
      const month = (job.createdAt || new Date().toISOString()).substring(0, 7);
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

  const getCustomerReportData = () => {
    const customerMap = {};
    
    jobs.forEach((job) => {
      const name = (job.customerName || '').trim();
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
    })).sort((a, b) => b.revenue - a.revenue);
  };

  const dailyData = getDailyReportData();
  const monthlyData = getMonthlyReportData();
  const customerData = getCustomerReportData();

  return (
    <div className="space-y-6 pb-20 md:pb-12 animate-fadeIn">
      <div className="bg-white p-4 md:p-6 rounded-sm border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900">Business Analytics & Reports</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Track daily sales volume, monthly revenues, and top customer accounts.</p>
      </div>
    </div>
  );
}
