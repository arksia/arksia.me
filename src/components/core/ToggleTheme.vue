<script setup lang='ts'>
import SunIcon from '~icons/ri/sun-line'
import MoonIcon from '~icons/ri/moon-line'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const handleToggle = () => {
  toggleDark()
}
</script>

<template>
  <a class="select-none" title="Toggle Color Scheme" @click="handleToggle">
    <SunIcon v-if="isDark" />
    <MoonIcon v-else />
  </a>
</template>
