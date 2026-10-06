# LEARN — Nuxt data fetching, keys & caching playground

> Build brief for a small Nuxt app that makes `useAsyncData` keys, refetching and caching **visible** in Nuxt DevTools, the Network tab and the server terminal. Keep it simple: the code is part of the lesson.

---

## 0. Instructions for the build session

- Build in the step order in **PROGRESS.md** and **stop after each step** so the user can check it in DevTools.
- The data comes from a fake origin (`server/data/content.json`) on purpose. Its fake latency and hit counter make the caching visible.

---

## 1. Goals

1. Show when `useAsyncData` **fetches, reuses, purges and refetches**, and that the key is what decides it.
2. Show two ways to **never refetch in the current session** (no browser reload):
   - **client memory**: `getCachedData`
   - **server cache**: Nitro `defineCachedFunction`
3. Show how to **force a refetch** once a cache layer exists.
4. Show `useState` from a composable in DevTools.

---

## 2. Stack

| What     | Note                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Nuxt     | latest version                                                                                                 |
| Run      | local only: `nuxt dev`, and `nuxt build && nuxt preview` for the scenarios that depend on production behaviour |
| Inspect  | Nuxt DevTools (**Payload** tab: data + state; **Server Routes** tab), browser Network tab, server terminal     |
| Fetching | `useAsyncData` + `$fetch` throughout. Use `useFetch` only in scenario A5.                                      |

---

## 3. Verified facts (source: Nuxt `asyncData.ts` + nuxt.com docs)

### Keys

- `useAsyncData('key', fn)`: the string is the key. With no key, the key is generated from **file + line**.
- `useFetch(url)`: the key is generated from **URL + options + source location**. Identical `useFetch` calls in two components get **2 keys** and make **2 requests**.
- Calls with the same key share `data`, `error`, `status` and `pending`. These options **must match** across them, or you get a dev warning: `handler`, `deep`, `transform`, `pick`, `getCachedData`, `default`, `middleware`.
- The key can be reactive (`computed`, getter). When it changes, the composable fetches under the new key, and the old key is cleaned up if nothing else uses it.

### Lifetime: when is data dropped?

- Each key keeps a **consumer counter**. A `useAsyncData` or `useNuxtData` call adds 1, and unmounting removes 1.
- When the counter reaches **0**, Nuxt waits one `nextTick`. If nobody has re-registered the key by then, the data is **purged**: `payload.data[key]` is deleted and `data` goes back to its default. This happens because `experimental.purgeCachedData` is on by default.
- So when you navigate away and back, the data is refetched **unless** the new page also uses that key (directly or through `useNuxtData`).
- ⚠️ **The purge is skipped when the call has a custom `getCachedData`.**

### `getCachedData(key, nuxtApp, ctx)`

- `ctx.cause` is one of:
  - `'initial'`: first call or remount
  - `'refresh:manual'`: `refresh()` / `execute()`
  - `'refresh:hook'`: `refreshNuxtData()`
  - `'watch'`: `watch` sources or reactive options changed
- With `experimental.granularCachedData` on (the default), it is called on **every** refresh.
- Default implementation:
  ```ts
  ;(key, nuxtApp, ctx) => {
    if (nuxtApp.isHydrating) return nuxtApp.payload.data[key]
    if (ctx.cause !== 'refresh:manual' && ctx.cause !== 'refresh:hook')
      return nuxtApp.static.data[key]
  }
  ```
- ⚠️ A custom `getCachedData` that ignores `ctx.cause` turns `refresh()` into a **no-op**.

### Clearing

- `clear()` and `clearNuxtData(key | keys | fn)` delete `payload.data[key]` and reset `data`, `error` and `status`. With no argument, `clearNuxtData()` clears **all** keys.
- `refreshNuxtData(key?)` refetches with cause `'refresh:hook'`.
- `useNuxtData(key)` reads the cached value **and keeps the key alive**: it adds 1 to the counter.

### `useState`

- `useState(key, init)` is SSR-safe shared state. Its value is serialized into the payload and shown in **DevTools → Payload → State**.
- It is **never purged on navigation**. It stays for the whole session until `clearNuxtState(key)` is called.

### SSR

- On a **hard load**, the fetch runs on the server, and the data arrives in the HTML payload. **No API request appears in the Network tab**; the fetch only shows in the server terminal and in DevTools → Payload.
- Every demo starts on `/` and uses `<NuxtLink>` (client-side navigation).
- During SSR, `$fetch('/api/...')` calls the Nitro handler **in-process**, with no HTTP request.

### Nitro cache

- `defineCachedFunction(fn, { name, getKey, maxAge, swr, shouldInvalidateCache, shouldBypassCache })`.
- `maxAge` defaults to **1s**, so always set it. `swr` defaults to `true`.
- Storage key: `` `${group}:${name}:${getKey(...args)}.json` ``.
- Storage location:
  - **dev**: the filesystem at `.nuxt/cache`, so it **survives a dev-server restart**
  - **node build**: memory, lost on restart
- `shouldInvalidateCache(...args) => true` deletes the entry and fetches fresh. `shouldBypassCache` skips the cache but keeps the entry.

### Folders

- `shared/types/` is **auto-imported in both app and server**. Code in `shared/` must not import Vue or Nitro code.
- `server/utils/` is auto-imported in the server only.
- `app/` code is bundled for **browser + SSR**. `server/` code is **never** sent to the browser.

---

## 4. Routes → strategy (one strategy per content type)

| Route                                       | Content             | Strategy                    | Why this strategy                           |
| ------------------------------------------- | ------------------- | --------------------------- | ------------------------------------------- |
| `/ydelse/nyheder`, `/ydelse/nyheder/[slug]` | news                | **A: Plain**                | changes often, fresh on every visit is fine |
| `/ydelse/case`                              | cases               | **B: Client session cache** | rarely changes; fetch once per session      |
| `/ydelse/artikel`                           | articles            | **C: Server cache**         | shared by all users; protects the origin    |
| `/usefetch`                                 | news                | `useFetch` demo (A5)        | shows auto-generated keys                   |
| `/`                                         | links to everything | —                           | the starting point for every demo           |

- Only `nyheder` has a detail page. It exists for scenario A4.
- `nyheder/[slug]` **reads the current list key through `useNuxtData(keys.nyheder.list(category.value))`**, with `category` taken from `useNyhederFilter()`, and uses it as a placeholder (pattern from the docs). This keeps the list alive.

---

## 5. Architecture

```
shared/
  types/
    content.ts            # Nyhed, Case, Artikel, ApiResponse<T> = { data: T, meta: { servedAt, originFetchedAt, originHits } }

server/
  api/ydelse/
    nyheder/index.get.ts   # THIN: read query → call util → return
    nyheder/[slug].get.ts
    case/index.get.ts
    artikel/index.get.ts   # reads ?fresh, calls cachedArtikler (strategy C)
  utils/
    origin.ts             # reads content.json; fake latency (800ms) + originHits counter + "[origin] hit #n" log
    cache.ts              # cachedArtikler: the defineCachedFunction wrapper
  data/
    content.json          # fake data, 3–5 items per type

app/
  pages/
    index.vue
    usefetch.vue                     # A5
    ydelse/nyheder/{index,[slug]}.vue
    ydelse/case/index.vue
    ydelse/artikel/index.vue
  composables/
    useNyheder.ts           # A
    useCases.ts             # B
    useArtikler.ts          # C
    useNyhederFilter.ts     # useState demo (see §7)
  utils/
    keys.ts               # single source of truth for keys: keys.nyheder.list(cat), keys.nyheder.detail(slug), keys.case.list()
    sessionCache.ts       # sessionCache(): the getCachedData for strategy B (one shared function ref)
  components/
    DataCard.vue          # debug card (see §6)
```

### Rules

1. **Pages never call `$fetch`.** They call a composable. (Exception: `usefetch.vue`.)
2. **Composables are the only place that knows about keys and caching.**
3. **API routes are thin.** Logic lives in `server/utils`.
4. **Types that cross the boundary go in `shared/types`.** The app never imports from `server/`.
5. Keys always come from `keys.ts`, with prefixes `nyheder:`, `case:` and `artikel:`.
6. Use one explicit route file per endpoint, not a dynamic `[type]` route. That makes it obvious which endpoint uses which strategy.

---

## 6. `DataCard` (same UI on every page)

Shows:

- `key`
- `status`
- `meta.originFetchedAt`
- `meta.servedAt`
- `meta.originHits`

Buttons:
| Button | Calls | Purpose |
|---|---|---|
| Refresh | `refresh()` | cause `refresh:manual` |
| Refresh (hook) | `refreshNuxtData(key)` | cause `refresh:hook` |
| Clear | `clear()` | drop client data |
| Force fresh | strategy-specific (see §8) | bust every cache layer |

---

## 7. `useState` demo: `useNyhederFilter()`

```ts
export const useNyhederFilter = () => {
  const category = useState<'alle' | 'intern' | 'presse'>(
    'nyheder:filter',
    () => 'alle',
  )
  const setCategory = (c: typeof category.value) => {
    category.value = c
  }
  return { category, setCategory }
}
```

- `useNyheder()` uses a **reactive key**: `() => keys.nyheder.list(category.value)`.
- What it shows:
  - the state in DevTools → Payload → State
  - a reactive key change causing a refetch
  - the state **surviving navigation** even though the `nyheder:list:*` data is purged

---

## 8. Strategies

### A: Plain (`useNyheder`)

```ts
useAsyncData(
  () => keys.nyheder.list(category.value),
  () => $fetch(`/api/ydelse/nyheder`, { query: { category: category.value } }),
)
```

### B: Client session cache (`useCases`)

```ts
// app/utils/sessionCache.ts
export const sessionCache = (key, nuxtApp, ctx) => {
  if (ctx.cause === 'refresh:manual' || ctx.cause === 'refresh:hook') return // escape hatch
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}
// useCases.ts
useAsyncData(keys.case.list(), () => $fetch('/api/ydelse/case'), {
  getCachedData: sessionCache,
})
```

- Because a custom `getCachedData` is set, the purge is skipped, so the data stays in `payload.data` for the whole session.
- **Force fresh** = `refresh()`.
- Invalidate without fetching = `clear()`. The next mount fetches.
- Add a "broken" toggle that uses a `getCachedData` **without** the `ctx.cause` check, so people see Refresh do nothing.

### C: Server cache (`useArtikler`)

```ts
// server/utils/cache.ts
export const cachedArtikler = defineCachedFunction(
  (fresh?: boolean) => getContent('artikel'),
  {
    name: 'artikler',
    getKey: () => 'list',
    maxAge: 60 * 60,
    shouldInvalidateCache: (fresh?: boolean) => !!fresh,
  },
)
// useArtikler.ts
const fresh = ref(false)
useAsyncData(keys.artikel.list(), () =>
  $fetch('/api/ydelse/artikel', { query: { fresh: fresh.value || undefined } }),
)
// forceFresh: fresh.value = true; await refresh(); fresh.value = false
```

- The client still purges and refetches on navigation: the request shows in the Network tab, but it's fast and `originHits` doesn't change.
- A plain `refresh()` gets the server's cached value again. **Force fresh** has to bust the server entry.
- **B + C together**: `getCachedData` still works, because the two layers are independent. A forced refresh has to bypass both: `ctx.cause` for the client and `?fresh` for the server.

---

## 9. Demo scenarios (action → Network → DevTools / terminal)

| #   | Action                                                         | Network               | DevTools / terminal                                      |
| --- | -------------------------------------------------------------- | --------------------- | -------------------------------------------------------- |
| A1  | Hard reload `/ydelse/nyheder`                                  | no API XHR            | terminal `[origin] hit`; Payload has `nyheder:list:alle` |
| A2  | `/` → nyheder                                                  | 1 request             | key appears                                              |
| A3  | nyheder → case → nyheder                                       | 1 new nyheder request | `nyheder:list:*` gone while on case                      |
| A4  | nyheder → nyheder/[slug] → back                                | no list request       | list key stays (`useNuxtData` keeps it alive)            |
| A5  | `/usefetch`: two `useFetch('/api/ydelse/nyheder')` with no key | 2 requests            | 2 auto-generated keys                                    |
| A6  | Change the filter category                                     | 1 request             | new key; State `nyheder:filter` changes                  |
| A7  | Change the filter, then leave and come back                    | 1 request             | filter **kept** (useState), data refetched               |
| B1  | case → artikel → case                                          | none after the first  | `case:list` stays                                        |
| B2  | Refresh                                                        | 1 request             | new `originFetchedAt`                                    |
| B3  | Refresh with the "broken" toggle on                            | none                  | nothing changes                                          |
| B4  | Clear, then leave and come back                                | 1 request             | key reset, then refilled                                 |
| C1  | artikel → case → artikel                                       | 1 fast request        | `servedAt` changes, `originHits` same                    |
| C2  | Refresh                                                        | 1 request             | same `originFetchedAt`                                   |
| C3  | Force fresh                                                    | 1 request (~800 ms)   | `originHits` +1                                          |
| C4  | Restart `nuxt dev`, then reload                                | —                     | origin **not** hit (fs cache)                            |
| C5  | Same as C4 on `nuxt build && nuxt preview`                     | —                     | origin hit (memory cache)                                |

---

## 10. Cache strategies: short list

| Strategy                                            | Lives in       | Lifetime                       | Use when                                               |
| --------------------------------------------------- | -------------- | ------------------------------ | ------------------------------------------------------ |
| Shared key / `useNuxtData`                          | client         | while a component uses the key | the same data is used across components or pages       |
| `getCachedData` + payload                           | client memory  | session (until `clear`)        | read-mostly data, fetch once per session               |
| `useState`                                          | client memory  | session                        | UI state, or full manual control (you handle fetching) |
| `defineCachedFunction` / `defineCachedEventHandler` | server storage | `maxAge` / restart             | data shared across users; slow or rate-limited origin  |

Outside the app code, `routeRules` (`swr` / `isr` / `cache`) and HTTP `Cache-Control` can cache whole routes or responses at the server or CDN.

---

## 11. Client vs server: pros/cons

**Client cache (`getCachedData`)**

- ✅ Zero requests, instant, works on every deploy target, including static hosting.
- ❌ Per tab, lost on reload, memory grows for the whole session, every user fetches once.

**Server cache (`/server` + Nitro)**

- ✅ Shared across users, protects the origin (rate limits), survives reloads.
- ❌ One request per navigation still happens. The cache is per server instance. Invalidation is your job.

**Logic in `server/` vs `app/`**
| | `server/` | `app/` |
|---|---|---|
| Sent to the browser | never | yes (bundled for client + SSR) |
| Secrets (tokens, private `runtimeConfig`) | safe | must not be used |
| Can cache across users | yes | no |
| Shapes / trims the payload before the browser | yes | no (the browser downloads everything first) |
| Cost | extra hop on **client navigation only** + more code to own | none |

**Request flow: where the network calls happen**
| | Without `/server` (composable → origin) | With `/server` (composable → `/api` → origin) |
|---|---|---|
| First load (SSR) | Nuxt server → origin | Nuxt server → `/api` handler (**in-process, no HTTP**) → origin |
| Client navigation | browser → origin | browser → Nuxt server → origin |
| Client navigation, server cache hit | — | browser → Nuxt server (no origin call) |

- First load is documented: "During server-side rendering, calling `$fetch` to fetch your internal API routes will directly call the relevant function (emulating the request), saving an additional API call." ([nuxt.com/docs/4.x/api/utils/dollarfetch](https://nuxt.com/docs/4.x/api/utils/dollarfetch))
- Without `/server`, the browser can only call the origin directly if its token is safe to expose publicly.
