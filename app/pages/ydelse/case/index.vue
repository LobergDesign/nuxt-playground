<script setup lang="ts">
const { data, status, refresh, clear } = await useCases();

let counter = 0;

const postCase = () =>
  $fetch("/api/ydelse/case", {
    method: "POST",
    body: { title: `Ny case ${++counter}` },
  });
</script>

<template>
  <main>
    <h1>Case</h1>
    <p>key: <code>cases</code></p>
    <ul>
      <li
        v-for="c in data"
        :key="c.slug"
      >
        {{ c.title }}
      </li>
    </ul>
    <button @click="postCase">Post new case</button>
    <button @click="refresh()">Refetch</button>
    <button @click="clear()">Clear</button>
    <CasesCount />
  </main>
</template>
