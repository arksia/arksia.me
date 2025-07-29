<script setup lang="ts">
import GithubIcon from '~icons/uil/github-alt'

function toTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
</script>

<template>
  <header class="header">
    <nav class="nav">
      <div class="routes">
        <RouterLink to="/posts" title="Post">
          <span class="router-link">Posts</span>
        </RouterLink>
        <RouterLink to="/photos" title="Photos">
          <span class="router-link">Photos</span>
        </RouterLink>
      </div>

        
      <div class="links" style="float: right;">
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
  padding: 1.5rem 2rem;
  width: 100%;
  display: flex;
  box-sizing: border-box;
}

.nav a {
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  opacity: 0.6;
  outline: none;
}

.nav a:hover {
  opacity: 1;
  text-decoration-color: inherit;
}

.routes {
  margin-left: 50%;
  transform: translateX(-50%);
  display: grid;
  gap: 1rem;
  grid-auto-flow: column;
}

.links {
  margin-left: auto;
  display: grid;
  gap: 1rem;
  grid-auto-flow: column;
}
</style>
