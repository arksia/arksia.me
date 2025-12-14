<script setup lang="ts">
const ArtComponent = computed(() => {
  if (typeof window !== 'undefined') {
    return defineAsyncComponent(() => import('../arts/ArtFloat.vue'))
  }
  return null
})
</script>

<template>
  <div class="post-wapper">
    <ArtComponent v-if="ArtComponent" />
    <slot />
  </div>
</template>

<style scoped>
.post-wapper {
  padding: 0 1rem;
}
</style>
