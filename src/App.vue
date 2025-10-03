<script setup lang="ts">
</script>

<template>
  <NavBar />
  <main class="main">
    <Transition name="fade" mode="out-in" appear>
      <RouterView :key="$route.fullPath" />
    </Transition>
  </main>
</template>

<style scoped>
.main {
  padding: 2.5rem 1rem;
}

.fade-enter-active {
  transition: opacity 0.3s ease-in;
}

.fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
