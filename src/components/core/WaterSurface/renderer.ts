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

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer

    // 初始化属性
    this.lightDir = new THREE.Vector3(2.0, 2.0, -1.0).normalize()

    // 创建水面网格 - 增大尺寸
    const geometry = new THREE.PlaneGeometry(80, 40, 200, 200)
    this.waterMesh = new THREE.Mesh(geometry)
    this.waterMesh.position.y = 0 // 确保水面在 y=0 位置
    this.waterMesh.rotation.x = -Math.PI / 2 // 旋转水面使其水平

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
        
        // 确保水面高度变化可见
        worldPosition.y += info.r * 2.0; // 放大高度变化

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
        
        // 添加边缘渐变效果
        vec2 center = vec2(0.5, 0.5);
        vec2 pixelCoord = coord;
        float distanceFromCenter = length(pixelCoord - center);
        float maxDistance = 0.6; // 控制渐变范围，0.6表示从60%位置开始渐变
        float edgeFade = 1.0 - smoothstep(0.0, maxDistance, distanceFromCenter);
        
        // 应用边缘渐变到透明度
        float finalAlpha = baseAlpha * edgeFade;
        
        gl_FragColor = vec4(color, finalAlpha);
      }
    `

    this.waterShader = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        water: { value: null },
        light: { value: this.lightDir },
        eye: { value: this.camera.position },
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
    // 更新相机位置
    this.waterShader.uniforms.eye.value = this.camera.position

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
    // 更新相机位置
    this.waterShader.uniforms.eye.value = this.camera.position

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
}

export default Renderer
