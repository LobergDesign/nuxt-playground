<script setup lang="ts">
const { data } = useCases()
</script>

<template>
  <aside><strong>Antal cases</strong>: {{ data?.length }}</aside>
</template>
