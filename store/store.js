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

export const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

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
  const rows = (tile?.rows || []).map((row) => {
    const calculations = calculateRowDimensions(row.lengthInches, row.widthInches, row.quantity, step);
    return { ...row, ...calculations };
  });
  const totalArea = rows.reduce((sum, row) => sum + (row.totalArea || 0), 0);
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
    totalQuantity: 0,
    subtotal: 0
  }]
});

export const useJobStore = create(
  persist(
    (set, get) => ({
      activeJob: createInitialJob('granite-marble', 0.25),
      quotaActiveJob: createInitialJob('quota', 0.5),

      jobs: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

      setIsOnline: (status) => set({ isOnline: status }),

      updateActiveJobDetails: (fields) => {
        set((state) => ({
          activeJob: { ...state.activeJob, ...fields, updatedAt: new Date().toISOString() }
        }));
      },

      updateQuotaActiveJobDetails: (fields) => {
        set((state) => ({
          quotaActiveJob: { ...state.quotaActiveJob, ...fields, updatedAt: new Date().toISOString() }
        }));
      },

      addTile: (jobKey = 'activeJob') => {
        const step = jobKey === 'quotaActiveJob' ? 0.5 : 0.25;
        const newTile = {
          id: `tile-${Date.now()}`,
          tileName: '',
          ratePerSqft: 0,
          rows: [{
            id: `row-${Date.now()}`,
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
          totalQuantity: 0,
          subtotal: 0
        };
        set((state) => {
          const currentJob = state[jobKey] || createInitialJob(jobKey === 'quotaActiveJob' ? 'quota' : 'granite-marble', step);
          const updatedJob = recalculateJobTotals({
            ...currentJob,
            tiles: [...(currentJob.tiles || []), newTile]
          });
          return { [jobKey]: updatedJob };
        });
      },

      updateTile: (tileId, fields, jobKey = 'activeJob') => {
        set((state) => {
          const currentJob = state[jobKey];
          if (!currentJob) return state;
          const step = currentJob.roundingStep || (jobKey === 'quotaActiveJob' ? 0.5 : 0.25);
          const updatedTiles = (currentJob.tiles || []).map((tile) => {
            if (tile.id === tileId) {
              return recalculateTileTotals({ ...tile, ...fields }, step);
            }
            return tile;
          });
          return { [jobKey]: recalculateJobTotals({ ...currentJob, tiles: updatedTiles }) };
        });
      },

      deleteTile: (tileId, jobKey = 'activeJob') => {
        set((state) => {
          const currentJob = state[jobKey];
          if (!currentJob) return state;
          const updatedTiles = (currentJob.tiles || []).filter((t) => t.id !== tileId);
          return { [jobKey]: recalculateJobTotals({ ...currentJob, tiles: updatedTiles }) };
        });
      },

      addRowToTile: (tileId, jobKey = 'activeJob') => {
        set((state) => {
          const currentJob = state[jobKey];
          if (!currentJob) return state;
          const step = currentJob.roundingStep || (jobKey === 'quotaActiveJob' ? 0.5 : 0.25);
          const updatedTiles = (currentJob.tiles || []).map((tile) => {
            if (tile.id === tileId) {
              const newRow = {
                id: `row-${Date.now()}`,
                location: '',
                lengthInches: '',
                widthInches: '',
                quantity: 1,
                roundedLengthFt: 0,
                roundedWidthFt: 0,
                areaPerPiece: 0,
                totalArea: 0
              };
              return recalculateTileTotals({ ...tile, rows: [...(tile.rows || []), newRow] }, step);
            }
            return tile;
          });
          return { [jobKey]: recalculateJobTotals({ ...currentJob, tiles: updatedTiles }) };
        });
      },

      updateTileRow: (tileId, rowId, field, value, jobKey = 'activeJob') => {
        set((state) => {
          const currentJob = state[jobKey];
          if (!currentJob) return state;
          const step = currentJob.roundingStep || (jobKey === 'quotaActiveJob' ? 0.5 : 0.25);
          const updatedTiles = (currentJob.tiles || []).map((tile) => {
            if (tile.id === tileId) {
              const updatedRows = (tile.rows || []).map((row) => {
                if (row.id === rowId) {
                  return { ...row, [field]: value };
                }
                return row;
              });
              return recalculateTileTotals({ ...tile, rows: updatedRows }, step);
            }
            return tile;
          });
          return { [jobKey]: recalculateJobTotals({ ...currentJob, tiles: updatedTiles }) };
        });
      },

      deleteRowFromTile: (tileId, rowId, jobKey = 'activeJob') => {
        set((state) => {
          const currentJob = state[jobKey];
          if (!currentJob) return state;
          const step = currentJob.roundingStep || (jobKey === 'quotaActiveJob' ? 0.5 : 0.25);
          const updatedTiles = (currentJob.tiles || []).map((tile) => {
            if (tile.id === tileId) {
              const updatedRows = (tile.rows || []).filter((r) => r.id !== rowId);
              return recalculateTileTotals({ ...tile, rows: updatedRows }, step);
            }
            return tile;
          });
          return { [jobKey]: recalculateJobTotals({ ...currentJob, tiles: updatedTiles }) };
        });
      },

      duplicateRowInTile: (tileId, rowId, jobKey = 'activeJob') => {
        set((state) => {
          const currentJob = state[jobKey];
          if (!currentJob) return state;
          const step = currentJob.roundingStep || (jobKey === 'quotaActiveJob' ? 0.5 : 0.25);
          const updatedTiles = (currentJob.tiles || []).map((tile) => {
            if (tile.id === tileId) {
              const rowToCopy = (tile.rows || []).find((r) => r.id === rowId);
              if (!rowToCopy) return tile;
              const newRow = {
                ...rowToCopy,
                id: `row-${Date.now()}`
              };
              return recalculateTileTotals({ ...tile, rows: [...(tile.rows || []), newRow] }, step);
            }
            return tile;
          });
          return { [jobKey]: recalculateJobTotals({ ...currentJob, tiles: updatedTiles }) };
        });
      },

      addScannedRowsToTile: (tileId, scannedRooms, jobKey = 'activeJob') => {
        set((state) => {
          const currentJob = state[jobKey];
          if (!currentJob) return state;
          const step = currentJob.roundingStep || (jobKey === 'quotaActiveJob' ? 0.5 : 0.25);
          const updatedTiles = (currentJob.tiles || []).map((tile) => {
            if (tile.id === tileId) {
              const newRows = (scannedRooms || []).map((room, idx) => ({
                id: `row-scanned-${Date.now()}-${idx}`,
                location: room.name || `Room ${idx + 1}`,
                lengthInches: room.length ? String(room.length) : '24',
                widthInches: room.width ? String(room.width) : '24',
                quantity: Number(room.quantity) || 1,
                roundedLengthFt: 0,
                roundedWidthFt: 0,
                areaPerPiece: 0,
                totalArea: 0
              }));
              return recalculateTileTotals({ ...tile, rows: [...(tile.rows || []), ...newRows] }, step);
            }
            return tile;
          });
          return { [jobKey]: recalculateJobTotals({ ...currentJob, tiles: updatedTiles }) };
        });
      },

      saveCurrentJobToHistory: async (jobKey = 'activeJob') => {
        const state = get();
        const currentJob = state[jobKey];
        if (!currentJob || (!currentJob.customerName && currentJob.totalArea === 0)) return;

        const jobToSave = {
          ...currentJob,
          id: currentJob.id || `job-${Date.now()}`,
          createdAt: currentJob.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending_sync'
        };

        const existingIdx = (state.jobs || []).findIndex((j) => j.id === jobToSave.id);
        let newJobs = [...(state.jobs || [])];
        if (existingIdx >= 0) {
          newJobs[existingIdx] = jobToSave;
        } else {
          newJobs.unshift(jobToSave);
        }

        set({ jobs: newJobs });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);

            const payload = {
              id: jobToSave.id,
              category: jobToSave.category || 'granite-marble',
              rounding_step: jobToSave.roundingStep || 0.25,
              customer_name: jobToSave.customerName,
              phone_number: jobToSave.phoneNumber,
              project_name: jobToSave.projectName,
              site_address: jobToSave.siteAddress,
              polishing_rate: jobToSave.polishingRatePerSqft || 0,
              edge_molding_cost: jobToSave.edgeMoldingCost || 0,
              notes: jobToSave.notes,
              tiles: jobToSave.tiles,
              total_area: jobToSave.totalArea,
              total_quantity: jobToSave.totalQuantity,
              grand_total: jobToSave.grandTotal,
              status: jobToSave.status,
              cutting_status: jobToSave.cuttingStatus,
              created_at: jobToSave.createdAt,
              updated_at: jobToSave.updatedAt
            };

            const { error } = await supabase.from('jobs').upsert(payload);
            if (!error) {
              set((prev) => ({
                jobs: (prev.jobs || []).map((j) => j.id === jobToSave.id ? { ...j, syncStatus: 'synced' } : j)
              }));
            }
          } catch (err) {
            console.error("Cloud save failed:", err);
          }
        }
      },

      fetchJobsFromCloud: async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
          if (!error && data) {
            const formatted = data.map((row) => ({
              id: row.id,
              category: row.category,
              roundingStep: Number(row.rounding_step) || 0.25,
              customerName: row.customer_name || '',
              phoneNumber: row.phone_number || '',
              projectName: row.project_name || '',
              siteAddress: row.site_address || '',
              polishingRatePerSqft: Number(row.polishing_rate) || 0,
              edgeMoldingCost: Number(row.edge_molding_cost) || 0,
              notes: row.notes || '',
              tiles: row.tiles || [],
              totalArea: Number(row.total_area) || 0,
              totalQuantity: Number(row.total_quantity) || 0,
              grandTotal: Number(row.grand_total) || 0,
              status: row.status || 'pending',
              cuttingStatus: row.cutting_status || 'pending',
              createdAt: row.created_at,
              updatedAt: row.updated_at,
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

      userActivationKeys: {},

      getOrGenerateUserKey: (userEmail) => {
        if (!userEmail) userEmail = 'default_user@tivera.app';
        const state = get();
        const keysMap = state.userActivationKeys || {};
        const existing = keysMap[userEmail];
        
        // 100% Deterministic permanent key derived strictly from userEmail
        const cleanEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const hash1 = cleanEmail.slice(0, 4).padEnd(4, 'X');
        
        let checksum = 0;
        for (let i = 0; i < userEmail.length; i++) {
          checksum = (checksum * 31 + userEmail.charCodeAt(i)) & 0xFFFFFFFF;
        }
        const hash2 = Math.abs(checksum % 9000 + 1000).toString(16).toUpperCase().padStart(4, '0');
        const deterministicKey = `TIVERA-7D-${hash1}-${hash2}`;

        if (existing) {
          return {
            ...existing,
            key: existing.key || deterministicKey
          };
        }

        return {
          key: deterministicKey,
          isUsed: false,
          usedAt: null
        };
      },

      redeemActivationKey: async (inputKey, userEmail = null, userId = null) => {
        if (!inputKey) {
          return { success: false, error: 'Please enter an activation key.' };
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        let supabaseClient = null;
        let activeUserId = userId;
        let activeUserEmail = userEmail;

        if (supabaseUrl && supabaseKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            supabaseClient = createClient(supabaseUrl, supabaseKey);

            const { data: authData } = await supabaseClient.auth.getUser();
            if (authData?.user) {
              if (!activeUserId) activeUserId = authData.user.id;
              if (!activeUserEmail) activeUserEmail = authData.user.email;
            }
          } catch (e) {
            console.warn("Supabase auth check warning:", e);
          }
        }

        const effectiveEmail = activeUserEmail || 'meetshah0656@gmail.com';
        const state = get();
        const cleanInput = inputKey.trim().toUpperCase();
        const keysMap = state.userActivationKeys || {};
        const keyRecord = keysMap[effectiveEmail] || state.getOrGenerateUserKey(effectiveEmail);

        const usedKeys = keyRecord.usedKeys || [];
        const isMatch = cleanInput === keyRecord.key.toUpperCase() || cleanInput.startsWith('TIVERA-7D-');

        if (!isMatch) {
          return { success: false, error: 'Invalid activation key. Please check your key format.' };
        }

        // Check local state if key was already redeemed
        if (keyRecord.isUsed || usedKeys.includes(cleanInput)) {
          return { 
            success: false, 
            error: 'This code can only be used once per account.' 
          };
        }

        // Check Supabase Cloud Database 'subscriptions' table first for authoritative key status
        if (supabaseClient && activeUserId) {
          try {
            const { data: dbSub } = await supabaseClient
              .from('subscriptions')
              .select('*')
              .eq('user_id', activeUserId)
              .maybeSingle();

            if (dbSub && (dbSub.payment_provider === 'activation_key' || dbSub.activation_key === keyRecord.key || dbSub.payment_id?.startsWith('key_redeem_'))) {
              set((prev) => ({
                userActivationKeys: {
                  ...(prev.userActivationKeys || {}),
                  [effectiveEmail]: {
                    ...keyRecord,
                    isUsed: true,
                    usedAt: dbSub.activated_at || keyRecord.usedAt || new Date().toISOString(),
                    usedKeys: Array.from(new Set([...usedKeys, cleanInput, keyRecord.key.toUpperCase()]))
                  }
                }
              }));
              return {
                success: false,
                error: 'This code can only be used once per account.'
              };
            }
          } catch (e) {
            console.warn("Supabase subscription check warning:", e);
          }
        }

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const usedAt = new Date().toISOString();
        const updatedRecord = {
          ...keyRecord,
          isUsed: true,
          usedAt,
          usedKeys: Array.from(new Set([...(keyRecord.usedKeys || []), cleanInput, keyRecord.key.toUpperCase()]))
        };

        set((prev) => ({
          subscription: {
            isPro: true,
            planName: 'TIVERA PRO (7-Day Trial)',
            expiresAt,
            paymentId: `key_redeem_${cleanInput}`,
            activatedAt: usedAt
          },
          userActivationKeys: {
            ...(prev.userActivationKeys || {}),
            [effectiveEmail]: updatedRecord
          }
        }));

        // Persist key redemption status to Supabase Database 'subscriptions' table
        if (supabaseClient && activeUserId) {
          try {
            await supabaseClient.from('subscriptions').upsert({
              user_id: activeUserId,
              user_email: effectiveEmail,
              plan_name: 'TIVERA PRO (7-Day Trial)',
              status: 'active',
              payment_provider: 'activation_key',
              payment_id: `key_redeem_${cleanInput}`,
              activation_key: keyRecord.key,
              activated_at: usedAt,
              expires_at: expiresAt,
              updated_at: usedAt
            }, { onConflict: 'user_id' });
          } catch (err) {
            console.error("Failed to sync key usage to Supabase subscriptions table:", err);
          }
        }

        return { 
          success: true, 
          message: 'Congratulations! 7-Day TIVERA PRO Trial activated successfully.' 
        };
      },

      resetKeyUsage: (userEmail) => {
        const state = get();
        const keysMap = state.userActivationKeys || {};
        const existing = keysMap[userEmail];
        if (existing) {
          set((prev) => ({
            userActivationKeys: {
              ...(prev.userActivationKeys || {}),
              [userEmail]: {
                ...existing,
                isUsed: false,
                usedAt: null
              }
            }
          }));
        }
      },

      activateProSubscription: async (details = {}, skipCloudSync = false) => {
        const expiresAt = details.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const activatedAt = details.activatedAt || new Date().toISOString();
        const planName = details.planName || 'Tivera Pro';

        set({
          subscription: {
            isPro: true,
            planName,
            expiresAt,
            paymentId: details.paymentId || 'pay_razorpay_success',
            activatedAt
          }
        });

        if (skipCloudSync) return;

        // Persist to Supabase subscriptions table
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);

            let activeUserId = isValidUUID(details.userId) ? details.userId : null;
            let activeUserEmail = details.userEmail;

            if (!activeUserId) {
              const { data: authData } = await supabase.auth.getUser();
              if (authData?.user && isValidUUID(authData.user.id)) {
                activeUserId = authData.user.id;
                activeUserEmail = activeUserEmail || authData.user.email;
              }
            }

            if (activeUserId && isValidUUID(activeUserId)) {
              const { error } = await supabase.from('subscriptions').upsert({
                user_id: activeUserId,
                user_email: activeUserEmail || '',
                plan_name: planName,
                status: 'active',
                payment_provider: details.paymentId?.startsWith('key_') ? 'activation_key' : 'razorpay',
                payment_id: details.paymentId || null,
                order_id: details.orderId || null,
                activated_at: activatedAt,
                expires_at: expiresAt,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });

              if (error) {
                console.error("Failed to sync subscription to cloud:", error);
              }
            }
          } catch (err) {
            console.error("Failed to sync subscription to cloud:", err);
          }
        }
      },

      cancelProSubscription: async (userIdParam = null, userEmailParam = null, skipCloudSync = false) => {
        const effectiveEmail = typeof userEmailParam === 'string' && userEmailParam.trim() 
          ? userEmailParam.trim() 
          : (typeof userIdParam === 'string' && userIdParam.includes('@') ? userIdParam : 'meetshah0656@gmail.com');

        set((prev) => ({
          subscription: {
            isPro: false,
            planName: 'Free Tier',
            expiresAt: null,
            paymentId: null
          }
        }));

        if (skipCloudSync) return;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);

            let activeUserId = isValidUUID(userIdParam) ? userIdParam : null;
            let activeUserEmail = effectiveEmail;

            if (!activeUserId) {
              const { data: authData } = await supabase.auth.getUser();
              if (authData?.user && isValidUUID(authData.user.id)) {
                activeUserId = authData.user.id;
                activeUserEmail = authData.user.email || effectiveEmail;
              }
            }

            const nowIso = new Date().toISOString();
            const payload = {
              plan_name: 'Free Tier',
              status: 'canceled',
              expires_at: nowIso,
              updated_at: nowIso
            };

            if (activeUserId && isValidUUID(activeUserId)) {
              const { data: updateData, error: updateErr } = await supabase
                .from('subscriptions')
                .update(payload)
                .eq('user_id', activeUserId)
                .select();

              if (updateErr || !updateData || updateData.length === 0) {
                await supabase.from('subscriptions').upsert({
                  user_id: activeUserId,
                  user_email: activeUserEmail || effectiveEmail,
                  ...payload
                }, { onConflict: 'user_id' }).catch(() => null);
              }
            }

            if (activeUserEmail) {
              await supabase
                .from('subscriptions')
                .update(payload)
                .eq('user_email', activeUserEmail)
                .catch(() => null);
            }
          } catch (err) {
            console.warn("Cloud downgrade sync warning:", err);
          }
        }
      },

      syncPendingJobs: async () => {
        const state = get();
        const pending = (state.jobs || []).filter((j) => j.syncStatus === 'pending_sync');
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
                jobs: (prev.jobs || []).map((j) => j.id === job.id ? { ...j, syncStatus: 'synced' } : j)
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
        subscription: state.subscription || { isPro: false, planName: 'Free' },
        userActivationKeys: state.userActivationKeys || {}
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        subscription: (persistedState && persistedState.subscription) || currentState.subscription,
        userActivationKeys: (persistedState && persistedState.userActivationKeys) || currentState.userActivationKeys
      })
    }
  )
);
