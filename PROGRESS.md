# Progress

One step = one question. Build → I verify

**Current:** step 2 (built, waiting for your test)

Finding: on SSR, the same key in page + child component hits the origin 2× (see asyncData.js:111, server calls `initialFetch()` per call).

## Steps

- [x] **0. App runs**: `<NuxtPage>` + nav.
- [x] **1. Keys basics**: page + component both `useAsyncData('nyheder')`.
  - 1 fetch or 2?
  - Navigate away: is the key removed? Back: refetch?
- [x] **2. Keep a key alive**: `useCases()` with `getCachedData: sessionCache` (no detail page; test case → nyheder → case).
  - Does the list survive case → nyheder → case?
  - show a button to post a new Case (to showcase we dont get new data when navigation)
  - add a button to "refetch" 'cases' (same key, new data) + Clear
  - make a CasesCount and show on "/" just as NyhederCount

## Done

- Step 2 files: server/utils/cases.ts, server/api/ydelse/case/index.{get,post}.ts, app/utils/sessionCache.ts, app/composables/useCases.ts, app/components/CasesCount.vue, app/pages/ydelse/case/index.vue, app/pages/index.vue. Dev deps: typescript@5 + vue-tsc (TS 7 breaks vue-tsc).
