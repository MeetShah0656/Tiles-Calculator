import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
  totalQuantity: number;  // sum of row quantities
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
  totalQuantity: number;  // sum of all tile quantities
  grandTotal: number;     // sum of all tile subtotals
  status: 'pending' | 'completed' | 'cancelled';
  syncStatus: 'synced' | 'pending_sync';
  createdAt: string;
  cuttingStatus?: 'pending' | 'ongoing' | 'done';
}

interface JobStore {
  activeJob: Omit<Job, 'id' | 'createdAt' | 'syncStatus'>;
  activeJobId: string | null;
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
  addScannedRowsToTile: (tileId: string, rooms: { name: string; length: number; width: number; unit: string; quantity: number; confidence: number; }[]) => void;
  
  updateJobCuttingStatus: (jobId: string, status: 'pending' | 'ongoing' | 'done') => void;
  
  resetActiveJob: () => void;
  
  // Job database operations
  saveJob: () => string; // Returns job ID
  loadJob: (id: string) => void;
  deleteJob: (id: string) => Promise<void>;
  duplicateJob: (id: string) => void;
  
  // Settings
  setOnline: (status: boolean) => void;
  syncPendingJobs: () => Promise<void>;
  fetchJobsFromCloud: () => Promise<void>;
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

const recalculateJobTotals = (activeJob: Omit<Job, 'id' | 'createdAt' | 'syncStatus'>): Omit<Job, 'id' | 'createdAt' | 'syncStatus'> => {
  const updatedTiles = activeJob.tiles.map(recalculateTileTotals);
  const totalArea = updatedTiles.reduce((sum, t) => sum + t.totalArea, 0);
  const totalQuantity = updatedTiles.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
  const grandTotal = updatedTiles.reduce((sum, t) => sum + t.subtotal, 0);
  return {
    ...activeJob,
    tiles: updatedTiles,
    totalArea,
    totalQuantity,
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
};

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      activeJob: initialActiveJob,
      activeJobId: null,
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
          totalQuantity: 1,
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
            totalQuantity: 1,
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

      addScannedRowsToTile: (tileId, rooms) => set((state) => {
        const activeJob = {
          ...state.activeJob,
          tiles: state.activeJob.tiles.map((t) => {
            if (t.id !== tileId) return t;
            
            const newRows: MeasurementRow[] = rooms.map(room => {
              let lenInches = room.length;
              let widInches = room.width;
              if (room.unit === 'ft') {
                lenInches = room.length * 12;
                widInches = room.width * 12;
              }
              
              return {
                id: Math.random().toString(36).substring(2, 11),
                location: room.name,
                lengthInches: String(lenInches),
                widthInches: String(widInches),
                quantity: room.quantity || 1,
                roundedLengthFt: 0,
                roundedWidthFt: 0,
                areaPerPiece: 0,
                totalArea: 0
              };
            });
            
            // If the single initial row is blank/empty, replace it entirely
            const isFirstRowEmpty = t.rows.length === 1 && !t.rows[0].location && !t.rows[0].lengthInches && !t.rows[0].widthInches;
            const updatedRows = isFirstRowEmpty ? newRows : [...t.rows, ...newRows];
            
            return {
              ...t,
              rows: updatedRows
            };
          })
        };
        return { activeJob: recalculateJobTotals(activeJob) };
      }),

      updateJobCuttingStatus: (jobId, status) => {
        set((state) => {
          const updatedJobs = state.jobs.map((job) => 
            job.id === jobId ? { ...job, cuttingStatus: status, syncStatus: 'pending_sync' as const } : job
          );
          return { jobs: updatedJobs };
        });
        get().syncPendingJobs();
      },

      resetActiveJob: () => set({
        activeJob: initialActiveJob,
        activeJobId: null
      }),

      saveJob: () => {
        const state = get();
        const existingId = state.activeJobId;
        
        if (existingId) {
          // Update existing job
          const updatedJob: Job = {
            ...state.activeJob,
            id: existingId,
            createdAt: state.jobs.find((j) => j.id === existingId)?.createdAt || new Date().toISOString(),
            syncStatus: 'pending_sync'
          };

          set((state) => ({
            jobs: state.jobs.map((j) => j.id === existingId ? updatedJob : j),
            activeJob: initialActiveJob,
            activeJobId: null
          }));

          get().syncPendingJobs();
          return existingId;
        } else {
          // Create new job
          const id = generateUUID();
          const newJob: Job = {
            ...state.activeJob,
            id,
            syncStatus: 'pending_sync',
            createdAt: new Date().toISOString()
          };

          set((state) => ({
            jobs: [newJob, ...state.jobs],
            activeJob: initialActiveJob,
            activeJobId: null
          }));

          get().syncPendingJobs();
          return id;
        }
      },

      loadJob: (id) => set((state) => {
        const targetJob = state.jobs.find((j) => j.id === id);
        if (!targetJob) return {};
        
        const { id: _, createdAt: __, syncStatus: ___, ...activeFields } = targetJob;
        return {
          activeJob: activeFields,
          activeJobId: id
        };
      }),

      deleteJob: async (id) => {
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id)
        }));

        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseKey) return;

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);

          if (error) {
            console.error("Failed to delete job from Supabase:", error);
          }
        } catch (err) {
          console.error("Failed to connect to Supabase for job deletion:", err);
        }
      },

      duplicateJob: (id) => set((state) => {
        const targetJob = state.jobs.find((j) => j.id === id);
        if (!targetJob) return {};

        const duplicatedJob: Job = {
          ...targetJob,
          id: generateUUID(),
          customerName: `${targetJob.customerName} (Copy)`,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending_sync'
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

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log("No authenticated user session found, deferring sync.");
            return;
          }

          for (const job of pending) {
            // Flatten first tile rate for legacy rate_per_sqft column support
            const rate_per_sqft = job.tiles[0]?.ratePerSqft || 0;
            
            // Backup serialized tiles and cutting status in notes to prevent info loss in legacy schema
            const serializedTiles = JSON.stringify(job.tiles);
            const cuttingStatusVal = job.cuttingStatus || 'pending';
            const notesWithMetadata = `${job.notes}\n\n__TILES_DATA__:${serializedTiles}\n\n__CUTTING_STATUS__:${cuttingStatusVal}`;

            const { error } = await supabase.from('jobs').upsert({
              id: job.id,
              user_id: user.id,
              customer_name: job.customerName,
              phone_number: job.phoneNumber,
              project_name: job.projectName,
              site_address: job.siteAddress,
              notes: notesWithMetadata,
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

              // Delete old rows first to support updates cleanly
              await supabase.from('measurement_rows').delete().eq('job_id', job.id);

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
      },

      fetchJobsFromCloud: async () => {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseKey) return;

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);

          // Get auth user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Fetch jobs sorted by created_at desc, filtered by current user
          const { data: dbJobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          if (!dbJobs) return;

          const fetchedJobs: Job[] = [];

          for (const dbJob of dbJobs) {
            let tiles: TileGroup[] = [];
            let cuttingStatus: 'pending' | 'ongoing' | 'done' = 'pending';
            let cleanNotes = dbJob.notes || '';
            
            // Extract tiles data
            if (cleanNotes.includes('__TILES_DATA__:')) {
              const parts = cleanNotes.split('__TILES_DATA__:');
              const tilesPart = parts[1].split('__CUTTING_STATUS__:')[0].trim();
              try {
                tiles = JSON.parse(tilesPart);
              } catch (e) {
                console.error("Failed to parse tiles JSON:", e);
              }
            }

            // Extract cutting status
            if (cleanNotes.includes('__CUTTING_STATUS__:')) {
              const parts = cleanNotes.split('__CUTTING_STATUS__:');
              const statusPart = parts[1].split('__TILES_DATA__:')[0].trim();
              cuttingStatus = statusPart as 'pending' | 'ongoing' | 'done';
            }

            // Clean notes of our specific metadata tags
            const tilesIdx = cleanNotes.indexOf('__TILES_DATA__:');
            const statusIdx = cleanNotes.indexOf('__CUTTING_STATUS__:');
            let firstIdx = -1;
            if (tilesIdx !== -1 && statusIdx !== -1) {
              firstIdx = Math.min(tilesIdx, statusIdx);
            } else if (tilesIdx !== -1) {
              firstIdx = tilesIdx;
            } else if (statusIdx !== -1) {
              firstIdx = statusIdx;
            }

            if (firstIdx !== -1) {
              cleanNotes = cleanNotes.substring(0, firstIdx).trim();
            }

            if (tiles.length === 0) {
              const { data: rows } = await supabase
                .from('measurement_rows')
                .select('*')
                .eq('job_id', dbJob.id);

              const measurementRows: MeasurementRow[] = (rows || []).map((r: any) => ({
                id: r.id,
                location: r.location || '',
                lengthInches: String(r.length_inches),
                widthInches: String(r.width_inches),
                quantity: r.quantity,
                roundedLengthFt: r.rounded_length_ft,
                roundedWidthFt: r.rounded_width_ft,
                areaPerPiece: r.area_per_piece,
                totalArea: r.total_area
              }));

              tiles = [{
                id: 'tile-default',
                tileName: 'Default Tile',
                ratePerSqft: dbJob.rate_per_sqft,
                rows: measurementRows,
                totalArea: dbJob.total_area,
                totalQuantity: measurementRows.reduce((sum, r) => sum + r.quantity, 0),
                subtotal: dbJob.grand_total
              }];
            }

            fetchedJobs.push({
              id: dbJob.id,
              customerName: dbJob.customer_name,
              phoneNumber: dbJob.phone_number || '',
              projectName: dbJob.project_name,
              siteAddress: dbJob.site_address || '',
              notes: cleanNotes,
              tiles,
              totalArea: dbJob.total_area || 0,
              totalQuantity: tiles.reduce((sum, t) => sum + (t.totalQuantity || 0), 0),
              grandTotal: dbJob.grand_total || 0,
              status: dbJob.status || 'pending',
              cuttingStatus,
              syncStatus: 'synced',
              createdAt: dbJob.created_at
            });
          }

          set((state) => {
            const localPending = state.jobs.filter((j) => j.syncStatus === 'pending_sync');
            const filteredFetched = fetchedJobs.filter((fj) => !localPending.some((lp) => lp.id === fj.id));
            return {
              jobs: [...localPending, ...filteredFetched]
            };
          });
        } catch (err) {
          console.error("Failed to pull jobs from Supabase:", err);
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
              cuttingStatus: oldJob.cuttingStatus || 'pending',
              tiles: [{
                id: 'tile-default',
                tileName,
                ratePerSqft,
                rows,
                totalArea,
                totalQuantity: rows.reduce((sum: number, r: any) => sum + (Number(r.quantity) || 0), 0),
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

