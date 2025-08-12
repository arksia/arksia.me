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
</script>

<template>
  <div ref="masonryRef" class="masonry-container">
    <div v-for="column in columns" :key="column[0]" class="masonry-column">
      <img v-for="photo in column" :key="photo" :src="photo" class="photo-image">
    </div>
  </div>
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
  will-change: opacity, transform;
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
</style>
