'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import ActiveJobCalculator from '@/components/ActiveJobCalculator';
import JobHistory from '@/components/JobHistory';
import CutListTab from '@/components/CutListTab';
import ReportsTab from '@/components/ReportsTab';
import { useJobStore, Job } from '@/store/store';
import ProfileTab from '@/components/ProfileTab';
import JobDetailsModal from '@/components/JobDetailsModal';
import { Printer, FileText } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const activeJob = useJobStore((state) => state.activeJob);
  const jobs = useJobStore((state) => state.jobs);
  const jobToPrint = detailJob || activeJob;

  const [jobViewModes, setJobViewModes] = useState<Record<string, 'compact' | 'full'>>({});
  const [singlePrintJobId, setSinglePrintJobId] = useState<string | null>(null);

  // Listen for browser print dialog closure to reset single print filtering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleAfterPrint = () => setSinglePrintJobId(null);
      window.addEventListener('afterprint', handleAfterPrint);
      return () => window.removeEventListener('afterprint', handleAfterPrint);
    }
  }, []);

  const handlePrintSingleJob = (jobId: string) => {
    setSinglePrintJobId(jobId);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  // Apply user custom theme accent color in real-time
  useEffect(() => {
    if (user?.user_metadata?.accent_color) {
      document.documentElement.style.setProperty('--primary-accent', user.user_metadata.accent_color);
    } else {
      document.documentElement.style.setProperty('--primary-accent', '#6e2020');
    }
  }, [user]);

  // Sync online status changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => useJobStore.getState().setOnline(true);
      const handleOffline = () => useJobStore.getState().setOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Recover active session on mount & subscribe to changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const checkSession = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const mergeUserProfile = async (authUser: any) => {
          if (!authUser) return null;
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single();
            if (prof) {
              return {
                ...authUser,
                user_metadata: {
                  ...authUser.user_metadata,
                  business_name: prof.business_name || authUser.user_metadata?.business_name,
                  phone_number: prof.phone_number || authUser.user_metadata?.phone_number,
                  accent_color: prof.accent_color || authUser.user_metadata?.accent_color
                }
              };
            }
          } catch (e) {
            console.error("Failed to merge profile:", e);
          }
          return authUser;
        };
        
        // Get active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const merged = await mergeUserProfile(session.user);
          setUser(merged);
          useJobStore.getState().fetchJobsFromCloud();
        }

        // Listen for auth state changes (e.g., sign in, sign out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const merged = await mergeUserProfile(session.user);
            setUser(merged);
            useJobStore.getState().fetchJobsFromCloud();
          } else {
            setUser(null);
            useJobStore.setState({ jobs: [] });
          }
        });

        unsubscribe = () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Failed to recover session:", err);
      }
    };

    checkSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setUser(null);
    useJobStore.setState({ jobs: [] });
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to sign out from Supabase:", err);
    }
  };

  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} user={user} onViewJob={setDetailJob} />;
      case 'calculator':
        return <ActiveJobCalculator />;
      case 'history':
        return <JobHistory setCurrentTab={setCurrentTab} onViewJob={setDetailJob} />;
      case 'cutlist':
        return (
          <CutListTab 
            onViewJob={setDetailJob} 
            jobViewModes={jobViewModes}
            setJobViewModes={setJobViewModes}
            onPrintSingleJob={handlePrintSingleJob}
          />
        );
      case 'reports':
        return <ReportsTab />;
      case 'profile':
        return <ProfileTab user={user} onProfileUpdate={setUser} />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} user={user} onViewJob={setDetailJob} />;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleEditJob = (job: Job) => {
    if (job.id === 'draft') {
      setCurrentTab('calculator');
    } else {
      useJobStore.getState().loadJob(job.id);
      setCurrentTab('calculator');
    }
    setDetailJob(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* Interactive App Shell (Hidden when printing) */}
      <div className="no-print flex-grow flex flex-col">
        <Navbar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          onLogout={handleLogout} 
        />
        
        <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pb-8">
          {renderTabContent()}
        </main>
      </div>

      <JobDetailsModal 
        job={detailJob} 
        onClose={() => setDetailJob(null)} 
        onEdit={handleEditJob} 
      />

      {/* High-Fidelity Printable Invoice Layout (Only active during print rendering when not on Cut List) */}
      {currentTab !== 'cutlist' && (
        <div id="printable-invoice" className="print-only p-5 bg-white text-black min-h-screen text-4xs font-sans">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-slate-900 pb-2">
            <div>
              <h1 className="text-xs font-extrabold tracking-tight text-slate-900 uppercase">
                {user?.user_metadata?.business_name || 'YASH MARBLE & TILES'}
              </h1>
              <p className="text-5xs text-slate-500 mt-0.5">
                Marble, Granite, Stone, Tiles & Custom Edge Fabrication Works
              </p>
              <p className="text-5xs text-slate-400 mt-0.5">
                Contact: {user?.user_metadata?.phone_number || 'N/A'} | Email: {user?.email}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-3xs font-black text-slate-950 uppercase">Estimate / Quote</h2>
              <p className="text-5xs text-slate-400 mt-0.5">
                Date: {(detailJob && detailJob.createdAt) ? new Date(detailJob.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Client & Project Details */}
          <div className="grid grid-cols-2 gap-2 mt-2 p-2 border border-slate-200 rounded-sm bg-slate-50/50 text-4xs">
            <div>
              <span className="block text-5xs font-bold uppercase tracking-wider text-slate-400">Customer Details</span>
              <p className="font-extrabold text-slate-900 mt-0.5 text-4xs">{jobToPrint.customerName || 'N/A'}</p>
              {jobToPrint.phoneNumber && <p className="text-5xs text-slate-500 mt-0.5">Phone: {jobToPrint.phoneNumber}</p>}
              {jobToPrint.siteAddress && <p className="text-5xs text-slate-500 mt-0.5">Site: {jobToPrint.siteAddress}</p>}
            </div>
            <div>
              <span className="block text-5xs font-bold uppercase tracking-wider text-slate-400">Project Details</span>
              <p className="font-extrabold text-slate-900 mt-0.5 text-4xs">{jobToPrint.projectName || 'N/A'}</p>
              {jobToPrint.notes && <p className="text-5xs text-slate-500 mt-0.5 italic">Notes: "{jobToPrint.notes.split('\n\n__TILES_DATA__')[0]}"</p>}
            </div>
          </div>

          {/* Measurements List Table */}
          {jobToPrint.tiles && jobToPrint.tiles.map((tile, tIdx) => (
            <div key={tile.id || tIdx} className="mt-3">
              <h3 className="font-extrabold text-slate-900 text-4xs uppercase mb-1 bg-slate-100 px-2.5 py-0.5 border border-slate-200 rounded-sm">
                {tile.tileName || `Tile Group ${tIdx + 1}`} &mdash; ₹{tile.ratePerSqft}/sq ft
              </h3>
              <table className="w-full text-left border-collapse border border-slate-200 text-5xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-5xs">
                    <th className="px-1.5 py-0.5 border border-slate-200 text-center w-5">#</th>
                    <th className="px-1.5 py-0.5 border border-slate-200">Location</th>
                    <th className="px-1.5 py-0.5 border border-slate-200">Length (in)</th>
                    <th className="px-1.5 py-0.5 border border-slate-200">Width (in)</th>
                    <th className="px-1.5 py-0.5 border border-slate-200 text-center">Qty</th>
                    <th className="px-1.5 py-0.5 border border-slate-200">Rounded Length (ft)</th>
                    <th className="px-1.5 py-0.5 border border-slate-200">Rounded Width (ft)</th>
                    <th className="px-1.5 py-0.5 border border-slate-200 text-right">Area/Piece (sq ft)</th>
                    <th className="px-1.5 py-0.5 border border-slate-200 text-right">Total Area (sq ft)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tile.rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="px-1.5 py-0.5 border border-slate-200 text-center">{idx + 1}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200 font-semibold">{row.location || '-'}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200 font-semibold">{row.lengthInches || '-'}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200 font-semibold">{row.widthInches || '-'}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200 text-center font-semibold">{row.quantity}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200">{row.roundedLengthFt > 0 ? `${row.roundedLengthFt.toFixed(2)} ft` : '-'}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200">{row.roundedWidthFt > 0 ? `${row.roundedWidthFt.toFixed(2)} ft` : '-'}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200 text-right font-medium">{row.areaPerPiece > 0 ? row.areaPerPiece.toFixed(2) : '-'}</td>
                      <td className="px-1.5 py-0.5 border border-slate-200 text-right font-bold">{row.totalArea > 0 ? row.totalArea.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-extrabold border-t border-slate-350 text-5xs text-slate-800">
                    <td className="px-1.5 py-0.5 border border-slate-200 text-center" colSpan={4}>Group Total</td>
                    <td className="px-1.5 py-0.5 border border-slate-200 text-center">{tile.totalQuantity || tile.rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)}</td>
                    <td className="px-1.5 py-0.5 border border-slate-200" colSpan={3}></td>
                    <td className="px-1.5 py-0.5 border border-slate-200 text-right">{tile.totalArea.toFixed(2)} sq ft</td>
                  </tr>
                </tfoot>
              </table>
              <div className="flex justify-end text-5xs font-bold text-slate-700 mt-0.5 pr-1 space-x-2">
                <span>Total Qty: {tile.totalQuantity || tile.rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)} pcs</span>
                <span>Total Area: {tile.totalArea.toFixed(2)} sq ft</span>
                <span>Subtotal: {formatCurrency(tile.subtotal)}</span>
              </div>
            </div>
          ))}

          {/* Pricing Summary */}
          <div className="flex justify-end mt-4">
            <div className="w-1/2 space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-sm text-2xs">
              <div className="flex justify-between font-bold text-slate-600 items-center">
                <span>Total Qty (All Tiles):</span>
                <span className="font-black text-slate-950 text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shadow-3xs">
                  {jobToPrint.totalQuantity || jobToPrint.tiles.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)} pcs
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-600 items-center">
                <span>Total Area (All Tiles):</span>
                <span className="font-black text-slate-950 text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shadow-3xs">
                  {jobToPrint.totalArea.toFixed(2)} sq ft
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2 items-center text-xs">
                <span>Grand Total:</span>
                <span className="text-primary font-black text-base bg-white px-2.5 py-1 rounded border border-primary/20 shadow-2xs">
                  {formatCurrency(jobToPrint.grandTotal)}
                </span>
              </div>
            </div>
          </div>
          {/* Footer Disclaimers */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-5xs text-slate-400">
            <p>This is a computer-generated quote. Running dimensions rounded to the nearest 0.25 ft increment.</p>
            <p className="mt-0.5 font-semibold text-slate-600">&copy; {user?.user_metadata?.business_name || 'TileSuite'} &bull; Thank you for your business!</p>
          </div>
        </div>
      )}

      {/* High-Fidelity Printable Cut List Layout (Only active during print rendering when on Cut List tab) */}
      {currentTab === 'cutlist' && (
        <div id="printable-cutlist" className="print-only p-5 bg-white text-black min-h-screen text-4xs font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-900 pb-2">
            <div>
              <h1 className="text-xs font-extrabold tracking-tight text-slate-900 uppercase">
                {user?.user_metadata?.business_name || 'YASH MARBLE & TILES'}
              </h1>
              <p className="text-5xs text-slate-500 mt-0.5">
                Fabrication Workshop Checklist & Cut List
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-3xs font-black text-slate-950 uppercase">Workshop Cut List</h2>
              <p className="text-5xs text-slate-400 mt-0.5">
                Date: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Checklist Summary */}
          <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-sm text-4xs flex justify-between items-center">
            <span className="font-bold text-slate-700">Active Fabrication Jobs Summary</span>
            <span className="font-black text-slate-950 text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shadow-3xs">
              {(() => {
                const activeTotal = activeJob.tiles.reduce((sum, t) => sum + t.rows.reduce((rSum, r) => rSum + (r.lengthInches && r.widthInches ? r.quantity : 0), 0), 0);
                const savedTotal = jobs
                  .filter(job => job.cuttingStatus === 'pending' || job.cuttingStatus === 'ongoing')
                  .reduce((sum, j) => sum + j.tiles.reduce((tSum, t) => tSum + t.rows.reduce((rSum, r) => rSum + (r.lengthInches && r.widthInches ? r.quantity : 0), 0), 0), 0);
                return activeTotal + savedTotal;
              })()}{' '}
              pcs to cut
            </span>
          </div>

          {/* Job Sections */}
          <div className="space-y-4 mt-3">
            {(() => {
              const getJobCuts = (jobId: string, jobName: string, projectName: string, tiles: any[], cuttingStatus: string, mode: 'compact' | 'full') => {
                const tileCuts = tiles.map((tile) => {
                  let cuts: any[] = [];
                  if (mode === 'compact') {
                    const map: Record<string, { length: number; width: number; quantity: number; roundedLength: number; roundedWidth: number; locations: string[] }> = {};
                    tile.rows.forEach((row: any) => {
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
                    cuts = tile.rows.filter((row: any) => row.lengthInches && row.widthInches).map((row: any) => ({
                      length: row.lengthInches,
                      width: row.widthInches,
                      quantity: Number(row.quantity) || 0,
                      roundedLength: row.roundedLengthFt || 0,
                      roundedWidth: row.roundedWidthFt || 0,
                      location: row.location || '-'
                    }));
                  }

                  return {
                    tileName: tile.tileName || 'Unnamed Tile Group',
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
                jobViewModes['draft'] || 'compact'
              );

              const savedJobsCuts = jobs
                .filter((job) => (job.cuttingStatus === 'pending' || job.cuttingStatus === 'ongoing'))
                .map((job) => getJobCuts(job.id, job.customerName, job.projectName, job.tiles, job.cuttingStatus || 'pending', jobViewModes[job.id] || 'compact'))
                .filter((jc) => jc.totalPieces > 0);

              let allJobCuts = [
                ...(activeJobCuts.totalPieces > 0 ? [activeJobCuts] : []),
                ...savedJobsCuts
              ];

              if (singlePrintJobId !== null) {
                allJobCuts = allJobCuts.filter(jc => jc.jobId === singlePrintJobId);
              }

              return allJobCuts.map((jobCut, jIdx) => (
                <div key={jIdx} className="border border-slate-200 rounded-sm p-3 bg-white space-y-2.5 avoid-break border-l-2 border-l-primary">
                  <div className="border-b border-slate-200 pb-1 flex justify-between items-center">
                    <div>
                      <span className="text-5xs font-bold uppercase tracking-wider text-slate-400">Client / Project</span>
                      <h3 className="text-4xs font-extrabold text-slate-900">{jobCut.jobName} &mdash; <span className="text-primary">{jobCut.projectName}</span></h3>
                    </div>
                    <div className="flex items-center space-x-2 text-5xs font-bold">
                      <span className="text-slate-400 font-medium">View: {jobViewModes[jobCut.jobId] || 'compact'}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-650 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                        {jobCut.jobId === 'draft' ? 'Current Draft' : jobCut.cuttingStatus === 'ongoing' ? 'Ongoing Cutting' : 'Queued'}
                      </span>
                    </div>
                  </div>

                  {jobCut.tileCuts.map((tileGroup, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-5xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 border border-slate-150 rounded flex justify-between">
                        <span>{tileGroup.tileName}</span>
                        <span>{tileGroup.totalPieces} pcs</span>
                      </div>
                      <table className="w-full text-left border-collapse border border-slate-200 text-5xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-5xs">
                            <th className="px-1.5 py-0.5 border border-slate-200 text-center w-5">#</th>
                            <th className="px-1.5 py-0.5 border border-slate-200">Location</th>
                            <th className="px-1.5 py-0.5 border border-slate-200">Length (in)</th>
                            <th className="px-1.5 py-0.5 border border-slate-200">Width (in)</th>
                            <th className="px-1.5 py-0.5 border border-slate-200 text-center">Qty</th>
                            <th className="px-1.5 py-0.5 border border-slate-200">Rounded Size (ft)</th>
                            <th className="px-1.5 py-0.5 border border-slate-200 text-center w-10">Cut Done</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tileGroup.cuts.map((item, cIdx) => (
                            <tr key={cIdx}>
                              <td className="px-1.5 py-0.5 border border-slate-200 text-center">{cIdx + 1}</td>
                              <td className="px-1.5 py-0.5 border border-slate-200 font-semibold truncate max-w-[80px]" title={item.location}>{item.location}</td>
                              <td className="px-1.5 py-0.5 border border-slate-200 font-semibold">{Number(item.length).toFixed(2)}"</td>
                              <td className="px-1.5 py-0.5 border border-slate-200 font-semibold">{Number(item.width).toFixed(2)}"</td>
                              <td className="px-1.5 py-0.5 border border-slate-200 text-center font-extrabold text-slate-900 text-[8.5px]">{item.quantity}</td>
                              <td className="px-1.5 py-0.5 border border-slate-200">{Number(item.roundedLength).toFixed(2)} x {Number(item.roundedWidth).toFixed(2)} ft</td>
                              <td className="px-1.5 py-0.5 border border-slate-200 text-center">
                                <span className="inline-block w-2.5 h-2.5 border border-slate-400 rounded-sm"></span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-5xs text-slate-400">
            <p>Fabrication Workshop Copy &mdash; Please check off completed pieces in the "Cut Done" column.</p>
            <p className="mt-0.5 font-semibold text-slate-600">&copy; {user?.user_metadata?.business_name || 'TileSuite'} &bull; Thank you!</p>
          </div>
        </div>
      )}

    </div>
  );
}
