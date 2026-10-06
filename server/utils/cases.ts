// In-memory "database": lives as long as the server process. Restarting nuxt dev resets it.
const cases = [
  { slug: 'kommune-a', title: 'Kommune A' },
  { slug: 'region-b', title: 'Region B' },
]

export const getCases = () => cases

export const addCase = (title: string) => {
  const item = { slug: `case-${cases.length + 1}`, title }
  cases.push(item)
  return item
}
