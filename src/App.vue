<script setup lang="ts">
</script>

<template>
  <NavBar />
  <main class="main">
    <Transition name="fade">
      <RouterView />
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
  transition: opacity 0.4s ease-out;
}

.fade-enter-from {
  opacity: 0;
}

.fade-leave-to {
  opacity: 0;
}
</style>
