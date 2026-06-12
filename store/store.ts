import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MeasurementRow {
  id: string;
  lengthInches: string; // Keep as string for form input handling
  widthInches: string;
  quantity: number;
  roundedLengthFt: number;
  roundedWidthFt: number;
  areaPerPiece: number;
  totalArea: number;
}

export interface Job {
  id: string;
  customerName: string;
  phoneNumber: string;
  projectName: string;
  siteAddress: string;
  notes: string;
  ratePerSqft: number;
  totalArea: number;
  grandTotal: number;
  status: 'pending' | 'completed' | 'cancelled';
  syncStatus: 'synced' | 'pending_sync';
  createdAt: string;
  rows: MeasurementRow[];
}

interface JobStore {
  activeJob: Omit<Job, 'id' | 'createdAt' | 'syncStatus'>;
  jobs: Job[];
  isOnline: boolean;
  
  // Actions
  updateActiveJobDetails: (fields: Partial<Omit<Job, 'id' | 'createdAt' | 'syncStatus' | 'rows'>>) => void;
  setRows: (rows: MeasurementRow[]) => void;
  addRow: () => void;
  updateRow: (id: string, field: 'lengthInches' | 'widthInches' | 'quantity', value: string | number) => void;
  duplicateRow: (id: string) => void;
  deleteRow: (id: string) => void;
  resetActiveJob: () => void;
  
  // Job database operations
  saveJob: () => string; // Returns job ID
  loadJob: (id: string) => void;
  deleteJob: (id: string) => void;
  duplicateJob: (id: string) => void;
  
  // Settings
  setOnline: (status: boolean) => void;
  syncPendingJobs: () => Promise<void>;
}

// Business Rules Functions
export const calculateFt = (inches: string | number): number => {
  const num = Number(inches);
  if (isNaN(num) || num <= 0) return 0;
  return num / 12;
};

export const roundToQuarterFt = (val: number): number => {
  if (val <= 0) return 0;
  return Math.ceil(val * 4) / 4;
};

const calculateRowDimensions = (lengthInches: string, widthInches: string, quantity: number) => {
  const lenFt = calculateFt(lengthInches);
  const widFt = calculateFt(widthInches);
  
  const roundedLengthFt = roundToQuarterFt(lenFt);
  const roundedWidthFt = roundToQuarterFt(widFt);
  
  // Area Per Piece = RoundedLength × RoundedWidth
  const areaPerPiece = roundedLengthFt * roundedWidthFt;
  // Total Area = AreaPerPiece × Quantity
  const totalArea = areaPerPiece * quantity;

  return {
    roundedLengthFt,
    roundedWidthFt,
    areaPerPiece,
    totalArea
  };
};

const initialActiveJob: Omit<Job, 'id' | 'createdAt' | 'syncStatus'> = {
  customerName: '',
  phoneNumber: '',
  projectName: '',
  siteAddress: '',
  notes: '',
  ratePerSqft: 0,
  totalArea: 0,
  grandTotal: 0,
  status: 'pending',
  rows: [{
    id: '1',
    lengthInches: '',
    widthInches: '',
    quantity: 1,
    roundedLengthFt: 0,
    roundedWidthFt: 0,
    areaPerPiece: 0,
    totalArea: 0
  }]
};

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      activeJob: initialActiveJob,
      jobs: [],
      isOnline: true,

      updateActiveJobDetails: (fields) => set((state) => {
        const updatedJob = { ...state.activeJob, ...fields };
        const grandTotal = updatedJob.totalArea * (updatedJob.ratePerSqft || 0);
        return {
          activeJob: {
            ...updatedJob,
            grandTotal
          }
        };
      }),

      setRows: (rows) => set((state) => {
        const totalArea = rows.reduce((sum, row) => sum + row.totalArea, 0);
        const grandTotal = totalArea * (state.activeJob.ratePerSqft || 0);
        return {
          activeJob: {
            ...state.activeJob,
            rows,
            totalArea,
            grandTotal
          }
        };
      }),

      addRow: () => set((state) => {
        const newRow: MeasurementRow = {
          id: Math.random().toString(36).substr(2, 9),
          lengthInches: '',
          widthInches: '',
          quantity: 1,
          roundedLengthFt: 0,
          roundedWidthFt: 0,
          areaPerPiece: 0,
          totalArea: 0
        };
        const rows = [...state.activeJob.rows, newRow];
        return {
          activeJob: {
            ...state.activeJob,
            rows
          }
        };
      }),

      updateRow: (id, field, value) => set((state) => {
        const rows = state.activeJob.rows.map((row) => {
          if (row.id !== id) return row;
          
          const updatedRow = { ...row };
          if (field === 'lengthInches') updatedRow.lengthInches = String(value);
          if (field === 'widthInches') updatedRow.widthInches = String(value);
          if (field === 'quantity') updatedRow.quantity = Number(value);

          const calculations = calculateRowDimensions(
            updatedRow.lengthInches,
            updatedRow.widthInches,
            updatedRow.quantity
          );

          return {
            ...updatedRow,
            ...calculations
          };
        });

        const totalArea = rows.reduce((sum, row) => sum + row.totalArea, 0);
        const grandTotal = totalArea * (state.activeJob.ratePerSqft || 0);

        return {
          activeJob: {
            ...state.activeJob,
            rows,
            totalArea,
            grandTotal
          }
        };
      }),

      duplicateRow: (id) => set((state) => {
        const targetRow = state.activeJob.rows.find((r) => r.id === id);
        if (!targetRow) return {};
        
        const newRow: MeasurementRow = {
          ...targetRow,
          id: Math.random().toString(36).substr(2, 9),
        };
        
        const rows = [...state.activeJob.rows, newRow];
        const totalArea = rows.reduce((sum, row) => sum + row.totalArea, 0);
        const grandTotal = totalArea * (state.activeJob.ratePerSqft || 0);
        
        return {
          activeJob: {
            ...state.activeJob,
            rows,
            totalArea,
            grandTotal
          }
        };
      }),

      deleteRow: (id) => set((state) => {
        const rows = state.activeJob.rows.filter((r) => r.id !== id);
        // Ensure at least one row remains
        const finalRows = rows.length > 0 ? rows : [
          {
            id: '1',
            lengthInches: '',
            widthInches: '',
            quantity: 1,
            roundedLengthFt: 0,
            roundedWidthFt: 0,
            areaPerPiece: 0,
            totalArea: 0
          }
        ];
        
        const totalArea = finalRows.reduce((sum, row) => sum + row.totalArea, 0);
        const grandTotal = totalArea * (state.activeJob.ratePerSqft || 0);
        
        return {
          activeJob: {
            ...state.activeJob,
            rows: finalRows,
            totalArea,
            grandTotal
          }
        };
      }),

      resetActiveJob: () => set({
        activeJob: initialActiveJob
      }),

      saveJob: () => {
        const state = get();
        const id = Math.random().toString(36).substr(2, 9);
        const newJob: Job = {
          ...state.activeJob,
          id,
          syncStatus: state.isOnline ? 'synced' : 'pending_sync',
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          jobs: [newJob, ...state.jobs],
          activeJob: initialActiveJob
        }));

        // Try background syncing
        get().syncPendingJobs();

        return id;
      },

      loadJob: (id) => set((state) => {
        const targetJob = state.jobs.find((j) => j.id === id);
        if (!targetJob) return {};
        
        // Exclude DB sync fields when putting in active state
        const { id: _, createdAt: __, syncStatus: ___, ...activeFields } = targetJob;
        return {
          activeJob: activeFields
        };
      }),

      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id)
      })),

      duplicateJob: (id) => set((state) => {
        const targetJob = state.jobs.find((j) => j.id === id);
        if (!targetJob) return {};

        const duplicatedJob: Job = {
          ...targetJob,
          id: Math.random().toString(36).substr(2, 9),
          customerName: `${targetJob.customerName} (Copy)`,
          createdAt: new Date().toISOString(),
          syncStatus: state.isOnline ? 'synced' : 'pending_sync'
        };

        return {
          jobs: [duplicatedJob, ...state.jobs]
        };
      }),

      setOnline: (isOnline) => {
        set({ isOnline });
        if (isOnline) {
          get().syncPendingJobs();
        }
      },

      syncPendingJobs: async () => {
        const state = get();
        const pending = state.jobs.filter((j) => j.syncStatus === 'pending_sync');
        if (pending.length === 0) return;

        // Try loading Supabase credentials from local environment
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseKey) {
            console.log("Supabase key omitted; keeping local-only persistence mode active.");
            return;
          }

          // If dynamically imported client is available, sync items:
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);

          for (const job of pending) {
            const { error } = await supabase.from('jobs').insert({
              id: job.id,
              customer_name: job.customerName,
              phone_number: job.phoneNumber,
              project_name: job.projectName,
              site_address: job.siteAddress,
              notes: job.notes,
              rate_per_sqft: job.ratePerSqft,
              total_area: job.totalArea,
              grand_total: job.grandTotal,
              status: job.status,
              created_at: job.createdAt
            });

            if (!error) {
              // Sync rows
              const rowsToInsert = job.rows.map((row) => ({
                job_id: job.id,
                length_inches: Number(row.lengthInches),
                width_inches: Number(row.widthInches),
                quantity: row.quantity,
                rounded_length_ft: row.roundedLengthFt,
                rounded_width_ft: row.roundedWidthFt,
                area_per_piece: row.areaPerPiece,
                total_area: row.totalArea
              }));

              await supabase.from('measurement_rows').insert(rowsToInsert);

              // Update local state to synced
              set((state) => ({
                jobs: state.jobs.map((j) => j.id === job.id ? { ...j, syncStatus: 'synced' } : j)
              }));
            }
          }
        } catch (err) {
          console.error("Auto sync failed, will retry next connection reload", err);
        }
      }
    }),
    {
      name: 'tile-calculator-storage',
      partialize: (state) => ({
        activeJob: state.activeJob,
        jobs: state.jobs
      })
    }
  )
);
