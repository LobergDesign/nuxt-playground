export default defineEventHandler(() => {
  // Shows in the server terminal every time the API is really hit
  console.log('[api] GET /api/ydelse/case')
  return getCases()
})
