<script setup lang='ts'>
import MoonIcon from '~icons/ri/moon-line'
import SunIcon from '~icons/ri/sun-line'

const isDark = useDark()
const toggleDark = useToggle(isDark)

function handleToggle() {
  document.documentElement.classList.add('theme-transitioning')
  toggleDark()
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 300)
}
</script>

<template>
  <a title="Toggle Color Scheme" @click="handleToggle">
    <SunIcon v-if="isDark" />
    <MoonIcon v-else />
  </a>
</template>
