<script setup lang="ts">
import type { Post } from '~/types'

const router = useRouter()
const routes: Post[] = router.getRoutes()
  .filter(i => i.path.startsWith('/posts/') && !i.meta.frontmatter.hidden)
  .map(i => ({
    path: i.meta.frontmatter.redirect || i.path,
    title: i.meta.frontmatter.title,
    catalog: i.meta.frontmatter.catalog,
    date: i.meta.frontmatter.date,
    lang: i.meta.frontmatter.lang,
    duration: i.meta.frontmatter.duration,
    place: i.meta.frontmatter.place,
  }))
</script>

<template>
  <h1>Posts</h1>
  <div v-for="route in routes" :key="route.path">
    <h2>{{ route.title }}</h2>
  </div>
</template>
