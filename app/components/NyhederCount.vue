<script setup lang="ts">
// Same key as the page: does this cause a second request?
const { data } = useNyheder()
</script>

<template>
  <aside><strong>Antal nyheder</strong>: {{ data?.length }}</aside>
</template>
