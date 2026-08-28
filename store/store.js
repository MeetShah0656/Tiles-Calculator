import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const calculateFt = (inches) => {
  const num = Number(inches);
  if (isNaN(num) || num <= 0) return 0;
  return num / 12;
};

export const roundToStepFt = (val, step = 0.25) => {
  if (val <= 0) return 0;
  const factor = 1 / (step || 0.25);
  return Math.ceil(val * factor) / factor;
};

export const roundToQuarterFt = (val) => roundToStepFt(val, 0.25);
export const roundToHalfFt = (val) => roundToStepFt(val, 0.5);

const calculateRowDimensions = (lengthInches, widthInches, quantity, step = 0.25) => {
  const lenFt = calculateFt(lengthInches);
  const widFt = calculateFt(widthInches);
  
  const roundedLengthFt = roundToStepFt(lenFt, step);
  const roundedWidthFt = roundToStepFt(widFt, step);
  
  const areaPerPiece = roundedLengthFt * roundedWidthFt;
  const totalArea = areaPerPiece * (Number(quantity) || 0);

  return {
    roundedLengthFt,
    roundedWidthFt,
    areaPerPiece,
    totalArea
  };
};

const recalculateTileTotals = (tile, step = 0.25) => {
  const rows = tile.rows.map((row) => {
    const calculations = calculateRowDimensions(row.lengthInches, row.widthInches, row.quantity, step);
    return { ...row, ...calculations };
  });
  const totalArea = rows.reduce((sum, row) => sum + row.totalArea, 0);
  const totalQuantity = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const subtotal = totalArea * (tile.ratePerSqft || 0);
  return {
    ...tile,
    rows,
    totalArea,
    totalQuantity,
    subtotal
  };
};

export const recalculateJobTotals = (job) => {
  const step = job.roundingStep || (job.category === 'quota' ? 0.5 : 0.25);
  const updatedTiles = (job.tiles || []).map((t) => recalculateTileTotals(t, step));
  const totalArea = updatedTiles.reduce((sum, t) => sum + t.totalArea, 0);
  const totalQuantity = updatedTiles.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
  const grandTotal = updatedTiles.reduce((sum, t) => sum + t.subtotal, 0);

  return {
    ...job,
    roundingStep: step,
    tiles: updatedTiles,
    totalArea,
    totalQuantity,
    grandTotal
  };
};

const createInitialJob = (category = 'granite-marble', roundingStep = 0.25) => ({
  category,
  roundingStep,
  customerName: '',
  phoneNumber: '',
  projectName: '',
  siteAddress: '',
  notes: '',
  polishingRatePerSqft: 0,
  edgeMoldingCost: 0,
  totalArea: 0,
  totalQuantity: 0,
  grandTotal: 0,
  status: 'pending',
  cuttingStatus: 'pending',
  tiles: [{
    id: 'tile-1',
    tileName: '',
    ratePerSqft: 0,
    rows: [{
      id: 'row-1',
      location: '',
      lengthInches: '',
      widthInches: '',
      quantity: 1,
      roundedLengthFt: 0,
      roundedWidthFt: 0,
      areaPerPiece: 0,
      totalArea: 0
    }],
    totalArea: 0,
    totalQuantity: 1,
    subtotal: 0
  }]
});

export const useJobStore = create(
  persist(
    (set, get) => ({
      activeJob: createInitialJob('granite-marble', 0.25),
      quotaActiveJob: createInitialJob('quota', 0.5),
      activeJobId: null,
      jobs: [],
      isOnline: true,

      setOnline: (status) => set({ isOnline: status }),

      // Active Job operations (Granite & Marble)
      updateActiveJobDetails: (fields) => set((state) => {
        const updatedJob = { ...state.activeJob, ...fields };
        return { activeJob: recalculateJobTotals(updatedJob) };
      }),

      // Quota Active Job operations
      updateQuotaActiveJobDetails: (fields) => set((state) => {
        const updatedJob = { ...state.quotaActiveJob, ...fields };
        return { quotaActiveJob: recalculateJobTotals(updatedJob) };
      }),

      addTile: (jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const newTile = {
          id: Math.random().toString(36).substr(2, 9),
          tileName: '',
          ratePerSqft: 0,
          rows: [{
            id: Math.random().toString(36).substr(2, 9),
            location: '',
            lengthInches: '',
            widthInches: '',
            quantity: 1,
            roundedLengthFt: 0,
            roundedWidthFt: 0,
            areaPerPiece: 0,
            totalArea: 0
          }],
          totalArea: 0,
          totalQuantity: 1,
          subtotal: 0
        };
        const updatedJob = {
          ...targetJob,
          tiles: [...targetJob.tiles, newTile]
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      updateTile: (tileId, fields, jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const updatedJob = {
          ...targetJob,
          tiles: targetJob.tiles.map((t) => t.id === tileId ? { ...t, ...fields } : t)
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      deleteTile: (tileId, jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const tiles = targetJob.tiles.filter((t) => t.id !== tileId);
        const finalTiles = tiles.length > 0 ? tiles : [
          {
            id: Math.random().toString(36).substr(2, 9),
            tileName: '',
            ratePerSqft: 0,
            rows: [{
              id: Math.random().toString(36).substr(2, 9),
              location: '',
              lengthInches: '',
              widthInches: '',
              quantity: 1,
              roundedLengthFt: 0,
              roundedWidthFt: 0,
              areaPerPiece: 0,
              totalArea: 0
            }],
            totalArea: 0,
            totalQuantity: 1,
            subtotal: 0
          }
        ];
        const updatedJob = {
          ...targetJob,
          tiles: finalTiles
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      addRowToTile: (tileId, jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const updatedJob = {
          ...targetJob,
          tiles: targetJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const newRow = {
              id: Math.random().toString(36).substr(2, 9),
              location: '',
              lengthInches: '',
              widthInches: '',
              quantity: 1,
              roundedLengthFt: 0,
              roundedWidthFt: 0,
              areaPerPiece: 0,
              totalArea: 0
            };
            return { ...t, rows: [...t.rows, newRow] };
          })
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      updateTileRow: (tileId, rowId, field, value, jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const updatedJob = {
          ...targetJob,
          tiles: targetJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const updatedRows = t.rows.map((r) => {
              if (r.id !== rowId) return r;
              return { ...r, [field]: value };
            });
            return { ...t, rows: updatedRows };
          })
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      duplicateRowInTile: (tileId, rowId, jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const updatedJob = {
          ...targetJob,
          tiles: targetJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const targetRowIndex = t.rows.findIndex((r) => r.id === rowId);
            if (targetRowIndex === -1) return t;
            const targetRow = t.rows[targetRowIndex];
            const duplicatedRow = {
              ...targetRow,
              id: Math.random().toString(36).substr(2, 9)
            };
            const newRows = [...t.rows];
            newRows.splice(targetRowIndex + 1, 0, duplicatedRow);
            return { ...t, rows: newRows };
          })
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      deleteRowFromTile: (tileId, rowId, jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const updatedJob = {
          ...targetJob,
          tiles: targetJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const filteredRows = t.rows.filter((r) => r.id !== rowId);
            const finalRows = filteredRows.length > 0 ? filteredRows : [
              {
                id: Math.random().toString(36).substr(2, 9),
                location: '',
                lengthInches: '',
                widthInches: '',
                quantity: 1,
                roundedLengthFt: 0,
                roundedWidthFt: 0,
                areaPerPiece: 0,
                totalArea: 0
              }
            ];
            return { ...t, rows: finalRows };
          })
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      addScannedRowsToTile: (tileId, scannedRooms, jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const updatedJob = {
          ...targetJob,
          tiles: targetJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const newRows = scannedRooms.map((room) => ({
              id: Math.random().toString(36).substr(2, 9),
              location: room.name || '',
              lengthInches: room.length ? String(room.length) : '',
              widthInches: room.width ? String(room.width) : '',
              quantity: Number(room.quantity) || 1,
              roundedLengthFt: 0,
              roundedWidthFt: 0,
              areaPerPiece: 0,
              totalArea: 0
            }));
            const filteredExisting = t.rows.filter(r => r.lengthInches || r.widthInches);
            return { ...t, rows: [...filteredExisting, ...newRows] };
          })
        };
        return { [jobType]: recalculateJobTotals(updatedJob) };
      }),

      saveJob: (jobType = 'activeJob') => set((state) => {
        const targetJob = state[jobType] || state.activeJob;
        const jobToSave = {
          ...recalculateJobTotals(targetJob),
          id: state.activeJobId || generateUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: state.isOnline ? 'synced' : 'pending_sync'
        };

        const existingIndex = state.jobs.findIndex((j) => j.id === jobToSave.id);
        let updatedJobs;
        if (existingIndex >= 0) {
          updatedJobs = [...state.jobs];
          updatedJobs[existingIndex] = jobToSave;
        } else {
          updatedJobs = [jobToSave, ...state.jobs];
        }

        const category = targetJob.category || 'granite-marble';
        const defaultStep = category === 'quota' ? 0.5 : 0.25;

        return {
          jobs: updatedJobs,
          [jobType]: createInitialJob(category, defaultStep),
          activeJobId: null
        };
      }),

      resetActiveJob: (category = 'granite-marble') => set((state) => {
        const defaultStep = category === 'quota' ? 0.5 : 0.25;
        const key = category === 'quota' ? 'quotaActiveJob' : 'activeJob';
        return {
          [key]: createInitialJob(category, defaultStep),
          activeJobId: null
        };
      }),

      loadJob: (id) => set((state) => {
        const jobToLoad = state.jobs.find((j) => j.id === id);
        if (!jobToLoad) return state;
        const recalculated = recalculateJobTotals(jobToLoad);
        const isQuota = recalculated.category === 'quota';
        return {
          activeJob: isQuota ? state.activeJob : recalculated,
          quotaActiveJob: isQuota ? recalculated : state.quotaActiveJob,
          activeJobId: id
        };
      }),

      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id)
      })),

      duplicateJob: (id) => set((state) => {
        const original = state.jobs.find((j) => j.id === id);
        if (!original) return state;
        const duplicated = {
          ...original,
          id: generateUUID(),
          customerName: `${original.customerName} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return { jobs: [duplicated, ...state.jobs] };
      }),

      updateJobCuttingStatus: (id, status) => set((state) => {
        const updatedJobs = state.jobs.map((j) => j.id === id ? { ...j, cuttingStatus: status } : j);
        return { jobs: updatedJobs };
      }),

      fetchJobsFromCloud: async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });

          if (!error && data) {
            const formatted = data.map((d) => recalculateJobTotals({
              id: d.id,
              category: d.category || 'granite-marble',
              roundingStep: d.rounding_step || 0.25,
              customerName: d.customer_name,
              phoneNumber: d.phone_number,
              projectName: d.project_name,
              siteAddress: d.site_address,
              polishingRatePerSqft: d.polishing_rate || 0,
              edgeMoldingCost: d.edge_molding_cost || 0,
              notes: d.notes,
              tiles: d.tiles || [],
              status: d.status || 'pending',
              cuttingStatus: d.cutting_status || 'pending',
              createdAt: d.created_at,
              updatedAt: d.updated_at,
              syncStatus: 'synced'
            }));
            set({ jobs: formatted });
          }
        } catch (err) {
          console.error("Failed to fetch jobs from Supabase:", err);
        }
      },

      subscription: {
        isPro: false,
        planName: 'Free',
        expiresAt: null,
        paymentId: null
      },

      activateProSubscription: (details = {}) => {
        set({
          subscription: {
            isPro: true,
            planName: 'Tivera Pro',
            expiresAt: details.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            paymentId: details.paymentId || 'pay_razorpay_success',
            activatedAt: new Date().toISOString()
          }
        });
      },

      cancelProSubscription: () => {
        set({
          subscription: {
            isPro: false,
            planName: 'Free',
            expiresAt: null,
            paymentId: null
          }
        });
      },

      syncPendingJobs: async () => {
        const state = get();
        const pending = state.jobs.filter((j) => j.syncStatus === 'pending_sync');
        if (pending.length === 0) return;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);

          for (const job of pending) {
            const payload = {
              id: job.id,
              category: job.category || 'granite-marble',
              rounding_step: job.roundingStep || 0.25,
              customer_name: job.customerName,
              phone_number: job.phoneNumber,
              project_name: job.projectName,
              site_address: job.siteAddress,
              polishing_rate: job.polishingRatePerSqft || 0,
              edge_molding_cost: job.edgeMoldingCost || 0,
              notes: job.notes,
              tiles: job.tiles,
              total_area: job.totalArea,
              total_quantity: job.totalQuantity,
              grand_total: job.grandTotal,
              status: job.status,
              cutting_status: job.cuttingStatus,
              created_at: job.createdAt,
              updated_at: job.updatedAt
            };
            const { error } = await supabase.from('jobs').upsert(payload);
            if (!error) {
              set((prev) => ({
                jobs: prev.jobs.map((j) => j.id === job.id ? { ...j, syncStatus: 'synced' } : j)
              }));
            }
          }
        } catch (err) {
          console.error("Cloud sync failed:", err);
        }
      }
    }),
    {
      name: 'tivera-stone-calculator-storage',
      partialize: (state) => ({
        activeJob: state.activeJob,
        quotaActiveJob: state.quotaActiveJob,
        jobs: state.jobs,
        subscription: state.subscription
      })
    }
  )
);
