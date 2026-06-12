import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MeasurementRow {
  id: string;
  location: string;       // "Living Room Floor", "Kitchen Wall", etc.
  lengthInches: string;   // Keep as string for form input handling
  widthInches: string;
  quantity: number;
  roundedLengthFt: number;
  roundedWidthFt: number;
  areaPerPiece: number;
  totalArea: number;
}

export interface TileGroup {
  id: string;
  tileName: string;       // e.g. "Kajaria 60x60 Matt White"
  ratePerSqft: number;
  rows: MeasurementRow[];
  totalArea: number;      // auto-calculated
  subtotal: number;       // totalArea * ratePerSqft
}

export interface Job {
  id: string;
  customerName: string;
  phoneNumber: string;
  projectName: string;
  siteAddress: string;
  notes: string;
  tiles: TileGroup[];     // Replaces old flat rows and single ratePerSqft
  totalArea: number;      // sum of all tile areas
  grandTotal: number;     // sum of all tile subtotals
  status: 'pending' | 'completed' | 'cancelled';
  syncStatus: 'synced' | 'pending_sync';
  createdAt: string;
}

interface JobStore {
  activeJob: Omit<Job, 'id' | 'createdAt' | 'syncStatus'>;
  jobs: Job[];
  isOnline: boolean;
  
  // Actions
  updateActiveJobDetails: (fields: Partial<Omit<Job, 'id' | 'createdAt' | 'syncStatus' | 'tiles'>>) => void;
  
  // Tile actions
  addTile: () => void;
  updateTile: (tileId: string, fields: Partial<Pick<TileGroup, 'tileName' | 'ratePerSqft'>>) => void;
  deleteTile: (tileId: string) => void;
  
  // Row actions within tiles
  addRowToTile: (tileId: string) => void;
  updateTileRow: (tileId: string, rowId: string, field: 'location' | 'lengthInches' | 'widthInches' | 'quantity', value: string | number) => void;
  duplicateRowInTile: (tileId: string, rowId: string) => void;
  deleteRowFromTile: (tileId: string, rowId: string) => void;
  
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

const recalculateTileTotals = (tile: TileGroup): TileGroup => {
  const rows = tile.rows.map((row) => {
    const calculations = calculateRowDimensions(row.lengthInches, row.widthInches, row.quantity);
    return { ...row, ...calculations };
  });
  const totalArea = rows.reduce((sum, row) => sum + row.totalArea, 0);
  const subtotal = totalArea * (tile.ratePerSqft || 0);
  return {
    ...tile,
    rows,
    totalArea,
    subtotal
  };
};

const recalculateJobTotals = (activeJob: Omit<Job, 'id' | 'createdAt' | 'syncStatus'>): Omit<Job, 'id' | 'createdAt' | 'syncStatus'> => {
  const updatedTiles = activeJob.tiles.map(recalculateTileTotals);
  const totalArea = updatedTiles.reduce((sum, t) => sum + t.totalArea, 0);
  const grandTotal = updatedTiles.reduce((sum, t) => sum + t.subtotal, 0);
  return {
    ...activeJob,
    tiles: updatedTiles,
    totalArea,
    grandTotal
  };
};

const initialActiveJob: Omit<Job, 'id' | 'createdAt' | 'syncStatus'> = {
  customerName: '',
  phoneNumber: '',
  projectName: '',
  siteAddress: '',
  notes: '',
  totalArea: 0,
  grandTotal: 0,
  status: 'pending',
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
    subtotal: 0
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
        return { activeJob: recalculateJobTotals(updatedJob) };
      }),

      addTile: () => set((state) => {
        const newTile: TileGroup = {
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
          subtotal: 0
        };
        const activeJob = {
          ...state.activeJob,
          tiles: [...state.activeJob.tiles, newTile]
        };
        return { activeJob: recalculateJobTotals(activeJob) };
      }),

      updateTile: (tileId, fields) => set((state) => {
        const activeJob = {
          ...state.activeJob,
          tiles: state.activeJob.tiles.map((t) => t.id === tileId ? { ...t, ...fields } : t)
        };
        return { activeJob: recalculateJobTotals(activeJob) };
      }),

      deleteTile: (tileId) => set((state) => {
        const tiles = state.activeJob.tiles.filter((t) => t.id !== tileId);
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
            subtotal: 0
          }
        ];
        const activeJob = {
          ...state.activeJob,
          tiles: finalTiles
        };
        return { activeJob: recalculateJobTotals(activeJob) };
      }),

      addRowToTile: (tileId) => set((state) => {
        const activeJob = {
          ...state.activeJob,
          tiles: state.activeJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const newRow: MeasurementRow = {
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
            return {
              ...t,
              rows: [...t.rows, newRow]
            };
          })
        };
        return { activeJob: recalculateJobTotals(activeJob) };
      }),

      updateTileRow: (tileId, rowId, field, value) => set((state) => {
        const activeJob = {
          ...state.activeJob,
          tiles: state.activeJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const rows = t.rows.map((row) => {
              if (row.id !== rowId) return row;
              
              const updatedRow = { ...row };
              if (field === 'location') updatedRow.location = String(value);
              if (field === 'lengthInches') updatedRow.lengthInches = String(value);
              if (field === 'widthInches') updatedRow.widthInches = String(value);
              if (field === 'quantity') updatedRow.quantity = Number(value);

              return updatedRow;
            });
            return {
              ...t,
              rows
            };
          })
        };
        return { activeJob: recalculateJobTotals(activeJob) };
      }),

      duplicateRowInTile: (tileId, rowId) => set((state) => {
        const activeJob = {
          ...state.activeJob,
          tiles: state.activeJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const targetRow = t.rows.find((r) => r.id === rowId);
            if (!targetRow) return t;
            const newRow: MeasurementRow = {
              ...targetRow,
              id: Math.random().toString(36).substr(2, 9),
            };
            return {
              ...t,
              rows: [...t.rows, newRow]
            };
          })
        };
        return { activeJob: recalculateJobTotals(activeJob) };
      }),

      deleteRowFromTile: (tileId, rowId) => set((state) => {
        const activeJob = {
          ...state.activeJob,
          tiles: state.activeJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            const rows = t.rows.filter((r) => r.id !== rowId);
            const finalRows = rows.length > 0 ? rows : [
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
            return {
              ...t,
              rows: finalRows
            };
          })
        };
        return { activeJob: recalculateJobTotals(activeJob) };
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

        get().syncPendingJobs();

        return id;
      },

      loadJob: (id) => set((state) => {
        const targetJob = state.jobs.find((j) => j.id === id);
        if (!targetJob) return {};
        
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

        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseKey) {
            console.log("Supabase key omitted; keeping local-only persistence mode active.");
            return;
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);

          for (const job of pending) {
            // Flatten first tile rate for legacy rate_per_sqft column support
            const rate_per_sqft = job.tiles[0]?.ratePerSqft || 0;
            
            // Backup serialized tiles in notes to prevent info loss in legacy schema
            const serializedTiles = JSON.stringify(job.tiles);
            const notesWithTiles = `${job.notes}\n\n__TILES_DATA__:${serializedTiles}`;

            const { error } = await supabase.from('jobs').insert({
              id: job.id,
              customer_name: job.customerName,
              phone_number: job.phoneNumber,
              project_name: job.projectName,
              site_address: job.siteAddress,
              notes: notesWithTiles,
              rate_per_sqft,
              total_area: job.totalArea,
              grand_total: job.grandTotal,
              status: job.status,
              created_at: job.createdAt
            });

            if (!error) {
              // Flatten rows from all tiles to insert into measurement_rows table
              const rowsToInsert = job.tiles.flatMap((tile) => 
                tile.rows.map((row) => ({
                  job_id: job.id,
                  length_inches: Number(row.lengthInches) || 0,
                  width_inches: Number(row.widthInches) || 0,
                  quantity: row.quantity,
                  rounded_length_ft: row.roundedLengthFt,
                  rounded_width_ft: row.roundedWidthFt,
                  area_per_piece: row.areaPerPiece,
                  total_area: row.totalArea
                }))
              );

              if (rowsToInsert.length > 0) {
                await supabase.from('measurement_rows').insert(rowsToInsert);
              }

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
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || !persistedState) {
          const migrateJob = (oldJob: any): any => {
            if (!oldJob) return oldJob;
            if (oldJob.tiles) return oldJob; // already migrated
            
            const tileName = "Default Tile";
            const ratePerSqft = oldJob.ratePerSqft || 0;
            const rows = (oldJob.rows || []).map((r: any) => ({
              ...r,
              location: r.location || ''
            }));
            const totalArea = oldJob.totalArea || 0;
            const subtotal = totalArea * ratePerSqft;
            
            return {
              ...oldJob,
              tiles: [{
                id: 'tile-default',
                tileName,
                ratePerSqft,
                rows,
                totalArea,
                subtotal
              }]
            };
          };

          const migratedState = { ...persistedState };
          if (migratedState.activeJob) {
            migratedState.activeJob = migrateJob(migratedState.activeJob);
          }
          if (Array.isArray(migratedState.jobs)) {
            migratedState.jobs = migratedState.jobs.map(migrateJob);
          }
          return migratedState;
        }
        return persistedState;
      },
      partialize: (state) => ({
        activeJob: state.activeJob,
        jobs: state.jobs
      })
    }
  )
);

