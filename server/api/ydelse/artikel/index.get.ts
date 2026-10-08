export default defineEventHandler(() => {
  console.log('[api] GET /api/ydelse/artikel')
  return [
    { slug: 'guide-til-nuxt', title: 'Guide til Nuxt', category: 'tech' },
    { slug: 'datahentning-101', title: 'Datahentning 101', category: 'tech' },
    { slug: 'kundecase-x', title: 'Kundecase X', category: 'case' },
  ]
})
