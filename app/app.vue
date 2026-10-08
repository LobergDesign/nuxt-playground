<template>
  <div>
    <NuxtRouteAnnouncer />
    <!-- Nav on every page so scenarios like A3 (nyheder → case → nyheder) stay client-side -->
    <nav>
      <NuxtLink to="/">Home</NuxtLink> ·
      <NuxtLink to="/ydelse/nyheder">Nyheder (standard useAsyncData)</NuxtLink>
      · <NuxtLink to="/ydelse/case">Case ("in-memory client cache")</NuxtLink> ·
      <NuxtLink to="/ydelse/artikel">Artikler (standard useFetch)</NuxtLink> ·
      <NuxtLink to="/usefetch">useFetch (A5)</NuxtLink>
    </nav>
    <hr />
    <NuxtPage />
  </div>
</template>
