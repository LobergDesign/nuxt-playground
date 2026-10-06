import type { NuxtApp } from '#app'

// Custom getCachedData: reuse stored data for the whole session.
// Having a custom getCachedData also turns off the purge, so the key is never deleted on navigation.
export const sessionCache = (
  key: string,
  nuxtApp: NuxtApp,
  ctx: { cause: 'initial' | 'refresh:manual' | 'refresh:hook' | 'watch' },
) => {
  // Escape hatch: refresh() / refreshNuxtData() must really fetch
  if (ctx.cause === 'refresh:manual' || ctx.cause === 'refresh:hook') return
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}
