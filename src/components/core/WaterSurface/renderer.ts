import * as THREE from 'three'

const helperFunctions = `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const vec3 waterColor = vec3(0.8, 0.9, 1.0);
  uniform vec3 light;
  uniform sampler2D water;
  
  // 调整颜色计算函数，让透明水更清澈
  vec3 getWaterColor(vec3 normal, vec3 viewDir) {
    float fresnel = pow(1.0 - max(0.0, dot(-viewDir, normal)), 3.0);
    
    // 保持水的本色，不降低强度
    vec3 baseColor = waterColor;
    
    // 使用更柔和的反射色，避免发灰
    vec3 lightReflection = vec3(0.9, 0.95, 1.0) * fresnel * 0.2;
    
    // 让水更通透，减少颜色饱和度
    return mix(baseColor, lightReflection, fresnel * 0.5);
  }
`

interface Water {
  textureA: THREE.Texture
  textureB: THREE.Texture
  update: () => void
  addDrop: (x: number, y: number, radius: number, strength: number) => void
}

class Renderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private lightDir: THREE.Vector3
  private waterMesh: THREE.Mesh
  private waterShader!: THREE.ShaderMaterial
  private water!: Water

  // 固定相机位置
  private readonly FIXED_EYE_POSITION = new THREE.Vector3(0, 15, 30)

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer

    // 初始化属性
    this.lightDir = new THREE.Vector3(2.0, 2.0, -1.0).normalize()

    // 创建水面网格 - 增大尺寸
    const geometry = new THREE.PlaneGeometry(100, 50, 200, 200)
    this.waterMesh = new THREE.Mesh(geometry)

    // 固定水面位置，防止移动
    this.waterMesh.position.set(0, 0, 0)
    this.waterMesh.rotation.set(-Math.PI / 2, 0, 0)
    this.waterMesh.scale.set(1, 1, 1)

    // 确保水面网格不会意外变换
    this.waterMesh.matrixAutoUpdate = false
    this.waterMesh.updateMatrix()

    // 将水面网格添加到场景中
    this.scene.add(this.waterMesh)

    // 创建简化的着色器材质
    this.createShader()
  }

  private createShader() {
    const vertexShader = `
      uniform sampler2D water;
      varying vec3 worldPosition;
      varying vec2 coord;
      
      void main() {
        coord = uv;
        vec4 info = texture2D(water, coord);
        worldPosition = position;
        
        // 限制高度变化范围，防止过度变形
        float heightChange = clamp(info.r, -1.0, 1.0);
        worldPosition.y += heightChange * 1.0; // 减小高度变化幅度

        gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
      }
    `

    const fragmentShader = `${helperFunctions}
      uniform vec3 eye;
      varying vec3 worldPosition;
      varying vec2 coord;
      
      void main() {
        vec4 info = texture2D(water, coord);
        
        // 计算法线 - 添加安全检查
        vec3 normal;
        if (length(info.ba) > 0.0) {
          normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
        } else {
          normal = vec3(0.0, 1.0, 0.0); // 默认法线
        }
        vec3 viewDir = normalize(worldPosition - eye);
        
        // 计算光照强度
        float lightIntensity = max(0.0, dot(normal, normalize(light)));
        float waveEffect = lightIntensity * 0.8 + 0.2;
        
        // 增强的水面颜色，突出水纹效果
        vec3 color = getWaterColor(normal, viewDir);
        
        // 增强波光效果，让水纹更明显
        color += vec3(waveEffect * 0.3);
        
        // 菲涅尔效果控制透明度
        float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);

        // 让水稍微不透明一点
        float baseAlpha = max(0.4, lightIntensity * 0.4 + fresnel * 0.5);
        
        // 修复边缘渐变问题 - 确保完全覆盖UV边界
        vec2 center = vec2(0.5, 0.5);
        vec2 pixelCoord = coord;
        
        // 使用椭圆距离函数，确保椭圆形渐变
        vec2 normalizedCoord = (pixelCoord - center) * 2.0; // 将UV坐标扩展到[-1,1]范围
        float distanceFromCenter = length(normalizedCoord);
        
        // 从中心开始渐变，确保边缘完全透明
        float maxDistance = 1.0; // 从100%位置开始渐变，覆盖整个UV范围
        float edgeFade = 1.0 - smoothstep(0.5, maxDistance, distanceFromCenter);
        
        // 应用边缘渐变到透明度，确保边缘完全透明
        float finalAlpha = baseAlpha * edgeFade;
        
        // 如果透明度太低，直接丢弃像素，避免白色轮廓
        if (finalAlpha < 0.01) {
          discard;
        }
        
        gl_FragColor = vec4(color, finalAlpha);
      }
    `

    this.waterShader = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        water: { value: null },
        light: { value: this.lightDir },
        eye: { value: this.FIXED_EYE_POSITION }, // 使用固定相机位置
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // 禁用深度写入，避免透明问题
      blending: THREE.NormalBlending, // 使用正常混合以保持透明效果
      alphaTest: 0.0, // 移除透明度测试，允许完全透明
    })

    // 应用着色器到水面
    this.waterMesh.material = this.waterShader
  }

  renderWater(water: Water) {
    // 确保水面网格位置和变换保持稳定
    this.waterMesh.position.set(0, 0, 0)
    this.waterMesh.rotation.set(-Math.PI / 2, 0, 0)
    this.waterMesh.scale.set(1, 1, 1)

    // 强制更新矩阵
    this.waterMesh.updateMatrix()

    // 更新水面纹理
    if (water && water.textureA) {
      this.waterShader.uniforms.water.value = water.textureA
    }
    else {
      console.warn('Water texture is null or undefined')
    }

    // 渲染水面
    this.renderer.render(this.scene, this.camera)
  }

  // 更新水面纹理（不渲染，只更新纹理）
  updateWaterTexture(water: Water) {
    // 更新水面纹理
    if (water && water.textureA) {
      this.waterShader.uniforms.water.value = water.textureA
    }
  }

  // 设置光照方向
  setLightDirection(direction: THREE.Vector3) {
    this.lightDir.copy(direction)
    if (this.waterShader && this.waterShader.uniforms.light) {
      this.waterShader.uniforms.light.value = this.lightDir
    }
  }

  // 设置水面数据（用于从外部更新水面模拟数据）
  setWater(water: Water) {
    this.water = water
  }

  // 获取固定相机位置（可选，用于调试）
  getFixedEyePosition(): THREE.Vector3 {
    return this.FIXED_EYE_POSITION.clone()
  }

  // 重置水面网格位置（用于修复位置偏移）
  resetWaterPosition() {
    this.waterMesh.position.set(0, 0, 0)
    this.waterMesh.rotation.set(-Math.PI / 2, 0, 0)
    this.waterMesh.scale.set(1, 1, 1)
    this.waterMesh.updateMatrix()
  }
}

export default Renderer
