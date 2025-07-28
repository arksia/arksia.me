<script setup lang='ts'>
const isDark = useDark()
const toggleDark = useToggle(isDark)

const handleToggle = () => {
  toggleDark()
}
</script>

<template>
  <a class="select-none" title="Toggle Color Scheme" @click="handleToggle">
    switch
  </a>
</template>
