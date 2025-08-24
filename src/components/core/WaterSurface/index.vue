<script setup lang="ts">
import * as THREE from 'three'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import Renderer from './renderer'
import Water from './water'

const container = ref<HTMLDivElement>()
const isAnimating = ref(false)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let water: Water
let waterRenderer: Renderer
let animationId: number

// 鼠标交互
const mouse = new THREE.Vector2()

// 初始化 Three.js 场景
function initThreeJS() {
  if (!container.value)
    return

  // 创建场景
  scene = new THREE.Scene()

  // 创建相机
  const aspect = container.value.clientWidth / container.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.position.set(0, 20, 30) // 调整相机位置，更好地观察水面
  camera.lookAt(0, 0, 0)

  // 创建渲染器（启用透明背景）
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // 启用透明背景
    premultipliedAlpha: false, // 避免预乘透明度问题
  })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setClearColor(0x000000, 0) // 设置透明清除颜色
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.value.appendChild(renderer.domElement)

  // 创建水面模拟
  water = new Water(renderer)

  // 不需要设置波动参数，使用 webgl-water 的默认值

  // 创建水面渲染器
  waterRenderer = new Renderer(scene, camera, renderer)
  waterRenderer.setWater(water)

  // 创建光源
  createLights()

  // 设置完全透明的背景
  scene.background = null

  // 添加事件监听器
  addEventListeners()

  // 开始渲染循环
  isAnimating.value = true
  animate()

  if (water) {
    // 在中心位置添加水滴
    water.addDrop(0, 0, 0.15, 2.5) // 增强初始水滴强度，让水纹更明显
  }

  // 定期添加水滴，保持持续的波浪
  setInterval(() => {
    if (water && isAnimating.value) {
      // 随机位置添加水滴
      const x = Math.random() * 2 - 1
      const y = Math.random() * 2 - 1
      const radius = 0.08 + Math.random() * 0.12 // 增大半径范围
      const strength = 0.8 + Math.random() * 1.5 // 增强强度范围，让水纹更明显
      water.addDrop(x, y, radius, strength)
    }
  }, 1500) // 每1.5秒添加一个水滴，增加频率
}

// 球体创建功能已移除

// 创建光源
function createLights() {
  // 增强环境光，让水面在黑色背景中更可见
  const ambientLight = new THREE.AmbientLight(0x87CEEB, 2.0)
  scene.add(ambientLight)

  // 增强方向光（太阳光），突出反光效果
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3.0)
  directionalLight.position.set(0, 15, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 50
  directionalLight.shadow.camera.left = -10
  directionalLight.shadow.camera.right = 10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10
  scene.add(directionalLight)

  // 增强点光源，突出水面反光
  const pointLight = new THREE.PointLight(0x87CEEB, 2.0, 15)
  pointLight.position.set(0, 5, 0)
  scene.add(pointLight)

  // 添加额外的反光光源
  const specularLight = new THREE.PointLight(0xFFFFFF, 1.5, 20)
  specularLight.position.set(-5, 8, -5)
  scene.add(specularLight)

  // 将光照方向传递给水面渲染器
  if (waterRenderer) {
    waterRenderer.setLightDirection(directionalLight.position.clone().normalize())
  }
}

function addEventListeners() {
  if (!container.value)
    return

  // 鼠标事件
  container.value.addEventListener('mousedown', onMouseDown)
  container.value.addEventListener('mousemove', onMouseMove)
  container.value.addEventListener('mouseup', onMouseUp)
  container.value.addEventListener('click', onMouseClick)

  // 窗口大小变化
  window.addEventListener('resize', onWindowResize)
}

// 鼠标按下
function onMouseDown(event: MouseEvent) {
  updateMousePosition(event)
}

// 鼠标移动
function onMouseMove(event: MouseEvent) {
  updateMousePosition(event)
}

// 鼠标释放
function onMouseUp() {
  // 鼠标释放处理
}

// 鼠标点击
function onMouseClick(event: MouseEvent) {
  updateMousePosition(event)
  addDropAtMouse()
}

// 更新鼠标位置
function updateMousePosition(event: MouseEvent) {
  if (!container.value)
    return

  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / container.value.clientWidth) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / container.value.clientHeight) * 2 + 1
}

// 在鼠标位置添加水滴
function addDropAtMouse() {
  if (!water)
    return

  // 将鼠标坐标转换为纹理坐标
  const x = (mouse.x + 1) * 0.5
  const y = (mouse.y + 1) * 0.5

  water.addDrop(x, y, 0.1, 0.3)
}

function onWindowResize() {
  if (!container.value || !camera || !renderer)
    return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 渲染循环
function animate() {
  if (!isAnimating.value)
    return

  animationId = requestAnimationFrame(animate)

  // 获取当前时间
  const currentTime = performance.now() * 0.001

  // 更新水面模拟
  if (water) {
    water.update(currentTime)
  }

  // 渲染整个场景（包括光源和水面）
  if (renderer && scene && camera) {
    // 在渲染前更新水面纹理
    if (waterRenderer && water) {
      waterRenderer.updateWaterTexture(water)
    }
    renderer.render(scene, camera)
  }
}

onMounted(async () => {
  await nextTick()
  initThreeJS()
})

onUnmounted(() => {
  if (water) {
    water.dispose()
  }

  if (container.value) {
    container.value.removeEventListener('mousedown', onMouseDown)
    container.value.removeEventListener('mousemove', onMouseMove)
    container.value.removeEventListener('mouseup', onMouseUp)
    container.value.removeEventListener('click', onMouseClick)
  }

  window.removeEventListener('resize', onWindowResize)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div ref="container" class="water-surface" />
</template>

<style scoped>
.water-surface {
  width: 200px;
  height: 100px;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
