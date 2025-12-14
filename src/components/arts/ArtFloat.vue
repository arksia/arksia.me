<script setup lang="ts">
import { createNoise3D } from 'simplex-noise'
import './arts.css'

const el = useTemplateRef<HTMLCanvasElement>('el')
const size = reactive(useWindowSize())
const noise3d = createNoise3D()

const TOTAL_COUNT = 1200
const SIZE_BASE = 1.0
const ASCEND_SPEED = 0.2
const TURBULENCE = 0.16
const LIFETIME = 600
const DAMPING_X = 0.995
const DAMPING_Y = 0.998
const OPACITY_SMOOTH = 0.95
const WIND_FORCE_MULT = 0.02
const MAX_SPEED_MULT = 3
const DISAPPEAR_Y_RATIO = 0.2

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  maxLife: number
  opacity: number
  targetOpacity: number
  noiseOffset: number
}

const particles: Particle[] = []

function initCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  // @ts-expect-error vendor
  const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1
  const dpi = dpr / bsr

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = dpi * width
  canvas.height = dpi * height
  ctx.scale(dpi, dpi)

  return { ctx, dpi }
}

function createParticle(): Particle {
  return {
    x: Math.random() * size.width,
    y: size.height * (0.8 + (1 - Math.random() ** 2) * 0.2) + 10,
    vx: (Math.random() - 0.5) * TURBULENCE * (0.5 + Math.random()),
    vy: -ASCEND_SPEED * (0.5 + Math.random()),
    maxLife: LIFETIME + Math.random() * 1000,
    opacity: 0,
    targetOpacity: 0.7 + Math.random() * 0.3,
    noiseOffset: Math.random() * 1000,
  }
}

function updateParticles(t: number, targetCount: number = TOTAL_COUNT) {
  const addRate = Math.max(1, Math.floor(targetCount / 60))
  if (particles.length < targetCount && particles.length < TOTAL_COUNT) {
    for (let i = 0; i < addRate && particles.length < targetCount; i++) {
      particles.push(createParticle())
    }
  }

  const maxSpeed = TURBULENCE * MAX_SPEED_MULT
  const invHeight = 1 / size.height
  const timeBase = t * 0.08

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]

    const timeFactor = timeBase + p.noiseOffset
    const windNoise1 = noise3d(p.x * 0.002, p.y * 0.002 + p.noiseOffset, timeFactor * 0.5)
    const windNoise2 = noise3d(p.x * 0.001, p.y * 0.001 + p.noiseOffset + 500, timeFactor * 0.3) * 0.5
    const windForce = (windNoise1 + windNoise2) * TURBULENCE

    const riseNoise = noise3d(p.x * 0.0015, p.y * 0.0015 + p.noiseOffset + 1000, timeFactor * 0.4)
    p.vx += windForce * WIND_FORCE_MULT
    p.vy = -ASCEND_SPEED * (0.8 + Math.abs(riseNoise) * 0.4)
    p.vx *= DAMPING_X
    p.vy *= DAMPING_Y

    if (Math.abs(p.vx) > maxSpeed)
      p.vx = Math.sign(p.vx) * maxSpeed

    p.x += p.vx
    p.y += p.vy

    const heightRatio = Math.max(0, p.y * invHeight)
    let targetOpacity = p.targetOpacity

    // close to the top of the screen to be more lucency
    targetOpacity *= heightRatio
    p.opacity = Math.max(0.001, p.opacity * OPACITY_SMOOTH + targetOpacity * (1 - OPACITY_SMOOTH))

    if (p.y < DISAPPEAR_Y_RATIO * size.height || p.x < -10 || p.x > size.width + 10 || p.opacity <= 0.01)
      particles.splice(i, 1)
  }
}

function renderParticles(ctx: CanvasRenderingContext2D) {
  for (const p of particles) {
    const sizeVariation = 0.7 + Math.abs(noise3d(p.x * 0.005, p.y * 0.005 + p.noiseOffset, p.noiseOffset * 0.1)) * 0.6
    const particleSize = SIZE_BASE * sizeVariation * (0.9 + p.opacity * 0.2)

    ctx.fillStyle = `rgba(160, 160, 160, ${p.opacity})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2)
    ctx.fill()
  }
}

onMounted(() => {
  if (!el.value)
    return

  let ctx: CanvasRenderingContext2D | null = null

  function init() {
    if (!el.value || size.width <= 0 || size.height <= 0)
      return
    const result = initCanvas(el.value, size.width, size.height)
    ctx = result.ctx
    particles.length = 0
  }

  if (size.width > 0 && size.height > 0)
    init()

  let t = 0
  let currentTargetCount = 0
  let rampFrame = 0

  useRafFn(() => {
    if (!ctx || size.width <= 0 || size.height <= 0)
      return

    t += 0.005
    rampFrame += 1

    const RAMP_TIME = Math.floor(size.height / ASCEND_SPEED)
    if (rampFrame <= RAMP_TIME)
      currentTargetCount = Math.floor((rampFrame / RAMP_TIME) * TOTAL_COUNT)
    else
      currentTargetCount = TOTAL_COUNT

    ctx.clearRect(0, 0, size.width, size.height)
    updateParticles(t, currentTargetCount)
    renderParticles(ctx)
  })

  watchEffect(() => {
    if (el.value && size.width > 0 && size.height > 0)
      init()
  })
})
</script>

<template>
  <div class="art-container">
    <canvas ref="el" />
  </div>
</template>
