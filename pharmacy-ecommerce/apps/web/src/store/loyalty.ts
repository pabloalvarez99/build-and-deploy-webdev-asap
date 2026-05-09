import { create } from 'zustand'

interface LoyaltyTx {
  id: string
  points: number
  reason: string | null
  order_id: string | null
  created_at: string
}

interface LoyaltyState {
  points: number | null
  pointsValue: number | null
  transactions: LoyaltyTx[] | null
  loadedAt: number | null
  inflight: Promise<void> | null
  loadLoyalty: (force?: boolean) => Promise<void>
  clear: () => void
}

const TTL_MS = 60_000

export const useLoyaltyStore = create<LoyaltyState>()((set, get) => ({
  points: null,
  pointsValue: null,
  transactions: null,
  loadedAt: null,
  inflight: null,

  loadLoyalty: async (force = false) => {
    const { loadedAt, inflight } = get()
    if (inflight) return inflight
    if (!force && loadedAt && Date.now() - loadedAt < TTL_MS) return

    const p = (async () => {
      try {
        const res = await fetch('/api/loyalty')
        if (!res.ok) {
          set({ points: 0, pointsValue: 0, transactions: [], loadedAt: Date.now(), inflight: null })
          return
        }
        const data = await res.json()
        set({
          points: data.points ?? 0,
          pointsValue: data.points_value ?? 0,
          transactions: data.transactions ?? [],
          loadedAt: Date.now(),
          inflight: null,
        })
      } catch {
        set({ inflight: null })
      }
    })()
    set({ inflight: p })
    return p
  },

  clear: () => set({ points: null, pointsValue: null, transactions: null, loadedAt: null, inflight: null }),
}))
