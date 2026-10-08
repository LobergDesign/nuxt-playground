<script setup lang="ts">
const { data } = await useArtikler();

// useFetch doesn't return its key, so read it from the payload (where the data is stored by key)
const nuxtApp = useNuxtApp();
// Only useFetch auto-keys start with "$f" — this page has one useFetch, so that is its key
const key = computed(() =>
  Object.keys(nuxtApp.payload.data).find((k) => k.startsWith("$f")),
);
</script>

<template>
  <main>
    <h1>Artikler</h1>
    <p>
      key: <code>{{ key }}</code> (auto-generated)
    </p>
    <ul>
      <li
        v-for="a in data"
        :key="a.slug"
      >
        {{ a.title }} ({{ a.category }})
      </li>
    </ul>
    <ArtiklerCount />
  </main>
</template>
