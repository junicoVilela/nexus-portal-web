// Timings centralizados — milissegundos
export const TIMINGS = {
  // Debounce
  searchDebounceMs: 400,
  autosaveDebounceMs: 800,

  // Polling
  publicacoesPollIntervalMs: 4000,

  // Toast durations
  toast: {
    success: 3000,
    info: 4000,
    warn: 5000,
    error: 7000,
  },

  // Drafts (localStorage)
  draftMaxAgeDays: 7,

  // Persisted filters TTL
  filtersTtlDays: 30,

  // Cache (services)
  serviceCacheTtlMs: 60_000,

  // Animation timings
  focusDelayMs: 80,
} as const;
