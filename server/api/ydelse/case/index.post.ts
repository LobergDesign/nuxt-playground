export default defineEventHandler(async (event) => {
  const { title } = await readBody<{ title: string }>(event)
  console.log('[api] POST /api/ydelse/case', title)
  return addCase(title)
})
