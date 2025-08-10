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

const columnCount = ref(4)
const allColumns = ref<string[][]>([[], [], [], []])
const allColumnHeights = ref([0, 0, 0, 0])

const activeColumns = computed(() => allColumns.value.slice(0, columnCount.value))
const activeColumnHeights = computed(() => allColumnHeights.value.slice(0, columnCount.value))

const currentPhotoIndex = ref(0)

const isLoading = ref(false)

// calculate columns
function calculateColumns() {
  const width = window.innerWidth
  if (width < 480) {
    columnCount.value = 1
  }
  else if (width < 768) {
    columnCount.value = 2
  }
  else if (width < 1024) {
    columnCount.value = 3
  }
  else {
    columnCount.value = 4
  }
}

// relayout masonry
async function relayout() {
  if (isLoading.value) {
    return
  }
  if (currentPhotoIndex.value >= photos.length) {
    return
  }
  if (!masonryRef.value) {
    return
  }
  if (Math.min(...activeColumnHeights.value) > window.innerHeight - 72 + window.scrollY) {
    return
  }

  isLoading.value = true

  const columnWidth = (masonryRef.value.offsetWidth - (columnCount.value - 1) * remValue) / columnCount.value
  const preloads: Promise<{ width: number, height: number }>[] = []

  photos.slice(currentPhotoIndex.value, currentPhotoIndex.value + columnCount.value * 2).forEach((photo) => {
    const img = new Promise<{ width: number, height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      }
      img.onerror = reject
      img.src = photo.url
    })

    img.then(({ width, height }) => {
      const columnIndex = activeColumnHeights.value.indexOf(Math.min(...activeColumnHeights.value))
      allColumns.value[columnIndex].push(photo.url)
      const actualHeight = columnWidth * (height / width)
      allColumnHeights.value[columnIndex] += actualHeight + remValue
    }).catch(() => {
      console.error('Failed to load image:', photo.url)
    })

    preloads.push(img)
    currentPhotoIndex.value++
  })

  await Promise.allSettled(preloads)

  isLoading.value = false

  nextTick(() => {
    relayout()
  })
}

onMounted(() => {
  calculateColumns()
  nextTick(() => {
    relayout()
  })
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
    <div v-for="column in activeColumns" :key="column[0]" class="masonry-column">
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
