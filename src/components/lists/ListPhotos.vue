<script setup lang="ts">
import { throttle } from '~/utils'
import photos from '../../../photos/data'

const tempElement = document.createElement('div')
tempElement.style.width = '1rem'
tempElement.style.position = 'absolute'
tempElement.style.visibility = 'hidden'
document.body.appendChild(tempElement)
const remValue = tempElement.offsetWidth
document.body.removeChild(tempElement)

const masonryRef = ref<HTMLElement>()

const columns = ref<string[][]>([[], [], [], []])
const columnHeights = ref([0, 0, 0, 0])

const currentPhotoIndex = ref(0)

const isFullscreen = ref(false)
const isFullscreenReady = ref(false)
const fullscreenImage = ref('')
const isClosing = ref(false)

// Transform state
const transform = ref({
  x: 0,
  y: 0,
  scale: 1,
})

// Image dimensions
const imageSize = ref({
  width: 0,
  height: 0,
})

const fullscreenSize = ref({
  width: 0,
  height: 0,
})

// calculate columns
function calculateColumns() {
  const width = window.innerWidth
  let newColumnCount

  if (width < 480) {
    newColumnCount = 1
  }
  else if (width < 768) {
    newColumnCount = 2
  }
  else if (width < 1024) {
    newColumnCount = 3
  }
  else {
    newColumnCount = 4
  }
  if (columns.value.length !== newColumnCount) {
    columns.value = Array.from({ length: newColumnCount }, () => [])
    columnHeights.value = Array.from({ length: newColumnCount }, () => 0)
    currentPhotoIndex.value = 0
    relayout()
  }
}

// relayout masonry
function relayout() {
  if (currentPhotoIndex.value >= photos.length) {
    return
  }
  if (!masonryRef.value) {
    return
  }
  const scrollHeight = window.innerHeight - 72 + window.scrollY
  if (Math.min(...columnHeights.value) > scrollHeight) {
    return
  }

  const columnCount = columns.value.length
  const columnWidth = (masonryRef.value.offsetWidth - (columnCount - 1) * remValue) / columnCount

  while (currentPhotoIndex.value < photos.length && Math.min(...columnHeights.value) < scrollHeight) {
    const photo = photos[currentPhotoIndex.value]
    const { ImageWidth, ImageHeight } = photo
    if (!ImageWidth || !ImageHeight) {
      currentPhotoIndex.value++
      console.warn(`🖼️ ${photo.name} not have ImageWidth or ImageHeight`)
      continue
    }
    const columnIndex = columnHeights.value.indexOf(Math.min(...columnHeights.value))
    columns.value[columnIndex].push(photo.url)
    const actualHeight = columnWidth * (ImageHeight / ImageWidth)
    columnHeights.value[columnIndex] += actualHeight + remValue
    currentPhotoIndex.value++
  }

  nextTick(() => {
    relayout()
  })
}

onMounted(() => {
  calculateColumns()
  relayout()
  window.addEventListener('resize', throttle(calculateColumns, 100))
  window.addEventListener('scroll', throttle(relayout, 100))
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateColumns)
  window.removeEventListener('scroll', relayout)
})

function openFullscreen(event: MouseEvent, photo: string) {
  const target = event.target as HTMLImageElement
  const rect = target.getBoundingClientRect()

  // Record original image size
  imageSize.value = {
    width: rect.width,
    height: rect.height,
  }

  // Calculate fullscreen size
  const aspectRatio = imageSize.value.width / imageSize.value.height
  const maxWidth = window.innerWidth * 0.9
  const maxHeight = window.innerHeight * 0.9
  const windowAspectRatio = maxWidth / maxHeight

  if (aspectRatio > windowAspectRatio) {
    fullscreenSize.value = {
      width: maxWidth,
      height: maxWidth / aspectRatio,
    }
  }
  else {
    fullscreenSize.value = {
      width: maxHeight * aspectRatio,
      height: maxHeight,
    }
  }

  // Calculate scale
  const scale = fullscreenSize.value.width / imageSize.value.width

  // Initialize transform from original position
  // Image starts at: top: 50%, left: 50%
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  const originalCenterX = rect.left + rect.width / 2
  const originalCenterY = rect.top + rect.height / 2

  // Initial translate: move from screen center to original position
  const initialTranslateX = originalCenterX - centerX
  const initialTranslateY = originalCenterY - centerY

  // Final translate: back to center (0, 0) after scaling
  const finalTranslateX = 0
  const finalTranslateY = 0

  // Initialize transform at original position
  transform.value = {
    x: initialTranslateX,
    y: initialTranslateY,
    scale: 1,
  }

  fullscreenImage.value = photo
  isFullscreen.value = true
  isClosing.value = false
  document.body.style.overflow = 'hidden'

  // Animate to final transform (center with scale)
  requestAnimationFrame(() => {
    transform.value = {
      x: finalTranslateX,
      y: finalTranslateY,
      scale,
    }
    isFullscreenReady.value = true
  })
}

function closeFullscreen() {
  isClosing.value = true
  isFullscreenReady.value = false

  setTimeout(() => {
    isFullscreen.value = false
    fullscreenImage.value = ''
    isClosing.value = false
    document.body.style.overflow = ''
  }, 300)
}
</script>

<template>
  <div ref="masonryRef" class="masonry-container">
    <div v-for="column in columns" :key="column[0]" class="masonry-column">
      <template v-for="photo in column" :key="photo">
        <img
          v-if="!(fullscreenImage === photo && isFullscreenReady)"
          :src="photo"
          class="photo-image"
          @click="openFullscreen($event, photo)"
        >
        <div v-else :style="{ width: `${imageSize.width}px`, height: `${imageSize.height}px` }" />
      </template>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="fullscreen" mode="out-in" appear>
      <div
        v-if="isFullscreen"
        class="fullscreen-overlay"
        :style="{ pointerEvents: isClosing ? 'none' : 'auto' }"
        @click="closeFullscreen"
      >
        <div class="fullscreen-backdrop" :style="{ opacity: isClosing ? 0 : 1 }" />
        <img
          :src="fullscreenImage"
          class="fullscreen-image"
          :width="imageSize.width"
          :height="imageSize.height"
          :style="{
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
            transformOrigin: 'center center',
            opacity: isClosing ? 0 : 1,
          }"
        >
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.masonry-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  max-width: 125rem;
  margin: 0 auto;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.photo-image {
  display: block;
  width: 100%;
  height: auto;
  animation: slide-in-up 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes slide-in-up {
  0% {
    opacity: 0;
    transform: translateY(40px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.fullscreen-overlay {
  --preview-animation-duration: 0.3s;
}

.fullscreen-image {
  position: fixed;
  z-index: 10000;
  transition:
    transform var(--preview-animation-duration) cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity var(--preview-animation-duration) ease-out;
  will-change: transform, opacity;
  transform-origin: center center;
}

.fullscreen-leave-active {
  transition: all var(--preview-animation-duration) ease-out;
}

.fullscreen-leave-to {
  opacity: 0;
}

.fullscreen-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 9999;
  transition: opacity var(--preview-animation-duration) ease-out;
  animation: backdropFadeIn var(--preview-animation-duration) ease-out;
}

@keyframes backdropFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
}
</style>
