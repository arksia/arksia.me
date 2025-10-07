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
const originalImageTop = ref(0)
const originalImageLeft = ref(0)
const originalImageWidth = ref(0)
const originalImageHeight = ref(0)
const fullscreenImageWidth = ref(0)
const fullscreenImageHeight = ref(0)

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
  fullscreenImage.value = photo
  isFullscreen.value = true
  requestAnimationFrame(() => {
    isFullscreenReady.value = true
  })
  document.body.style.overflow = 'hidden'

  const target = event.target as HTMLImageElement
  const rect = target.getBoundingClientRect()
  originalImageTop.value = rect.top
  originalImageLeft.value = rect.left
  originalImageWidth.value = rect.width
  originalImageHeight.value = rect.height
  const aspectRatioOfImage = originalImageWidth.value / originalImageHeight.value
  const maxWidth = window.innerWidth * 0.9
  const maxHeight = window.innerHeight * 0.9
  const aspectRatioOfWindow = maxWidth / maxHeight
  if (aspectRatioOfImage > aspectRatioOfWindow) {
    fullscreenImageWidth.value = maxWidth
    fullscreenImageHeight.value = maxWidth / aspectRatioOfImage
  }
  else {
    fullscreenImageWidth.value = maxHeight * aspectRatioOfImage
    fullscreenImageHeight.value = maxHeight
  }
}

function closeFullscreen() {
  isFullscreen.value = false
  fullscreenImage.value = ''
  isFullscreenReady.value = false
  document.body.style.overflow = ''
  originalImageTop.value = 0
  originalImageLeft.value = 0
  originalImageWidth.value = 0
  originalImageHeight.value = 0
  fullscreenImageWidth.value = 0
  fullscreenImageHeight.value = 0
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
        <div v-else :style="{ width: `${originalImageWidth}px`, height: `${originalImageHeight}px` }" />
      </template>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="fullscreen" mode="out-in" appear>
      <div v-if="isFullscreen" @click="closeFullscreen">
        <div class="fullscreen-backdrop" />
        <img
          :src="fullscreenImage"
          :class="isFullscreenReady ? 'fullscreen-image done' : 'fullscreen-image'"
          :style="isFullscreenReady
            ? {
              width: `${fullscreenImageWidth}px`,
              height: `${fullscreenImageHeight}px`,
            }
            : {
              top: `${originalImageTop}px`,
              left: `${originalImageLeft}px`,
              width: `${originalImageWidth}px`,
              height: `${originalImageHeight}px`,
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
  animation: slide-in-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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

.fullscreen-image {
  position: fixed;
  z-index: 10000;
  transition: all 0.5s;
  will-change: transform, top, left;
}

.fullscreen-image.done {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.fullscreen-leave-active {
  transition: all 0.3s ease-out;
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
  animation: backdropFadeIn 0.3s ease-out;
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
