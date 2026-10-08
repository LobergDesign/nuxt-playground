<script setup lang="ts">
const { data, status } = await useNyheder();
</script>

<template>
  <main>
    <h1>Nyheder</h1>
    <p>key: <code>nyheder</code></p>
    <ul>
      <li
        v-for="n in data"
        :key="n.slug"
      >
        {{ n.title }} ({{ n.category }})
      </li>
    </ul>
    <NyhederCount />
  </main>
</template>
