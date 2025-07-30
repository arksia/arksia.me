<script setup lang='ts'>
import MoonIcon from '~icons/ri/moon-line'
import SunIcon from '~icons/ri/sun-line'

const isDark = useDark()
const toggleDark = useToggle(isDark)

function handleToggle() {
  toggleDark()
}
</script>

<template>
  <a class="select-none" title="Toggle Color Scheme" @click="handleToggle">
    <SunIcon v-if="isDark" />
    <MoonIcon v-else />
  </a>
</template>
