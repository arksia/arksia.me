<script setup lang="ts">
import GithubIcon from '~icons/uil/github-alt'

// function toTop() {
//   window.scrollTo({
//     top: 0,
//     behavior: 'smooth',
//   })
// }
</script>

<template>
  <header class="header">
    <nav class="nav">
      <div class="routes">
        <RouterLink to="/posts" title="Post">
          <span>Posts</span>
        </RouterLink>
        <RouterLink to="/photos" title="Photos">
          <span>Photos</span>
        </RouterLink>
      </div>

      <div class="links">
        <a href="https://github.com/arksia" target="_blank" title="GitHub">
          <GithubIcon />
        </a>
        <ToggleTheme />
      </div>
    </nav>
  </header>
</template>

<style scoped>
.header h1 {
  margin-bottom: 0;
}

.logo {
  position: absolute;
  top: 1rem;
  left: 1rem;
}

.nav {
  display: flex;
  padding: 1.5rem 2rem;
  align-items: center;
  box-sizing: border-box;
}

.nav a {
  display: block;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  outline: none;
}

.links a {
  line-height: 0;
}

.nav a:hover {
  opacity: 1;
  text-decoration-color: inherit;
}

.routes {
  display: grid;
  margin-left: 50%;
  transform: translateX(-50%);
  gap: 1rem;
  grid-auto-flow: column;
}

.links {
  display: grid;
  margin-left: auto;
  gap: 1rem;
  grid-auto-flow: column;
}
</style>
