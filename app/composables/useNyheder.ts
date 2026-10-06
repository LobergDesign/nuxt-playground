// Page and component both call this, so they register the SAME key with the SAME handler.
export const useNyheder = () =>
  useAsyncData('nyheder', () => $fetch('/api/ydelse/nyheder'))
