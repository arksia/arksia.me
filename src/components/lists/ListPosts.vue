<script setup lang="ts">
import type { Post } from '~/types'

const router = useRouter()
const routes: Post[] = router.getRoutes()
  .filter(i => i.path.startsWith('/posts/') && !i.meta.frontmatter.hidden)
  .map(i => ({
    path: i.meta.frontmatter.redirect || i.path,
    title: i.meta.frontmatter.title,
    catalog: i.meta.frontmatter.catalog,
    desc: i.meta.frontmatter.desc,
    date: i.meta.frontmatter.date,
    lang: i.meta.frontmatter.lang,
    duration: i.meta.frontmatter.duration,
    place: i.meta.frontmatter.place,
  }))

const posts = computed(() =>
  [...routes],
)
</script>

<template>
  <RouterLink v-for="post in posts" :key="post.path" class="post-item" :to="post.path">
    <div>
      <span class="post-item-desc">{{ post.desc }}</span>
      <span>{{ post.title }}</span>
      <span class="post-item-date">{{ post.date }}</span>
    </div>
    <div class="post-item-duration">
      <span>{{ post.duration }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.post-item {
  position: relative;
  display: flex;
  padding: 0.75rem 0;
  color: inherit;
  font-size: 1.125rem;
  text-decoration: none;
  cursor: pointer;
  opacity: 0.6;
  transition: 0.2s ease;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.post-item:hover {
  opacity: 1;
}

.post-item-desc {
  position: absolute;
  z-index: -1;
  opacity: 0;
  transform: translateY(1.25rem);
  transition: 0.5s ease;
  filter: blur(1px);
  pointer-events: none;
}

.post-item:hover .post-item-desc {
  opacity: 0.6;
}

.post-item-date {
  margin-left: 0.5rem;
  font-size: 1rem;
  opacity: 0.6;
}

.post-item-duration {
  font-size: 1rem;
  opacity: 0;
  transition: 0.2s ease;
}

.post-item:hover .post-item-duration {
  opacity: 0.6;
}
</style>
