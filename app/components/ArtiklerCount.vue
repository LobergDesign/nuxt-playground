<script setup lang="ts">
// Same composable → same auto-generated key: does this cause a second request?
const { data } = useArtikler()
</script>

<template>
  <aside><strong>Antal artikler</strong>: {{ data?.length }}</aside>
</template>
