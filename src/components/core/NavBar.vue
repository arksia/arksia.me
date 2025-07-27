<script setup lang="ts">
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
      <ToggleTheme />
      <div class="links">
        <RouterLink to="/posts" title="Post">
          <span class="router-link">Posts</span>
        </RouterLink>
        <RouterLink to="/photos" title="Photos">
          <span class="router-link">Photos</span>
        </RouterLink>
        <!-- <a href="https://github.com/arksia" target="_blank" title="GitHub">
          <div i-uil-github-alt />
        </a> -->
      </div>
      <ToggleTheme />
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
  padding: 1rem;
  width: 100%;
  display: flex;
  justify-content: space-between;
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

.links {
  display: grid;
  gap: 1rem;
  grid-auto-flow: column;
}
</style>
