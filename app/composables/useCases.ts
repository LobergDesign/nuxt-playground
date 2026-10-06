// Same key + same options everywhere (page and CasesCount), so they share one entry.
export const useCases = () =>
  useAsyncData('cases', () => $fetch('/api/ydelse/case'), {
    getCachedData: sessionCache,
  })
