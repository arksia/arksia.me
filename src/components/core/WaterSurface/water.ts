import * as THREE from 'three'

class Water {
  private plane: THREE.Mesh
  private renderTargetA: THREE.WebGLRenderTarget
  private renderTargetB: THREE.WebGLRenderTarget
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera

  // 着色器材质
  private dropShader!: THREE.ShaderMaterial
  private updateShader!: THREE.ShaderMaterial
  private normalShader!: THREE.ShaderMaterial
  private sphereShader!: THREE.ShaderMaterial

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer

    // 创建场景和相机
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // 创建平面网格
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.plane = new THREE.Mesh(geometry)
    this.scene.add(this.plane)

    // 创建渲染目标纹理
    const size = 256
    this.renderTargetA = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
    })

    this.renderTargetB = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
    })

    // 初始化纹理数据
    this.initializeTextures()

    // 创建着色器材质
    this.createShaders()
  }

  private initializeTextures() {
    // 创建初始数据：位置、速度、法线
    const size = 256
    const data = new Float32Array(size * size * 4)

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0.0 // 位置 y
      data[i + 1] = 0.0 // 速度 y
      data[i + 2] = 0.0 // 法线 x
      data[i + 3] = 1.0 // 法线 z
    }

    // 创建数据纹理
    const dataTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    dataTexture.needsUpdate = true

    // 渲染到两个纹理
    this.renderToTarget(this.renderTargetA, dataTexture)
    this.renderToTarget(this.renderTargetB, dataTexture)
  }

  private createShaders() {
    // 水滴着色器
    this.dropShader = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 coord;
        
        void main() {
          coord = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D waterTexture;
        uniform vec2 center;
        uniform float radius;
        uniform float strength;
        varying vec2 coord;
        
        const float PI = 3.14159;
        
        void main() {
          /* get vertex info */
          vec4 info = texture2D(waterTexture, coord);
          
          /* add the drop to the height */
          float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
          drop = 0.5 - cos(drop * PI) * 0.5;
          info.r += drop * strength;
          
          gl_FragColor = info;
        }
      `,
      uniforms: {
        waterTexture: { value: null },
        center: { value: new THREE.Vector2() },
        radius: { value: 0.0 },
        strength: { value: 0.0 },
      },
    })

    // 更新着色器
    this.updateShader = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 coord;
        
        void main() {
          coord = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
          uniform sampler2D waterTexture;
          uniform vec2 delta;
          uniform float time;
          varying vec2 coord;
          
          void main() {
            /* get vertex info */
            vec4 info = texture2D(waterTexture, coord);
            
            /* calculate average neighbor height */
            vec2 dx = vec2(delta.x, 0.0);
            vec2 dy = vec2(0.0, delta.y);
            float average = (
              texture2D(waterTexture, coord - dx).r +
              texture2D(waterTexture, coord - dy).r +
              texture2D(waterTexture, coord + dx).r +
              texture2D(waterTexture, coord + dy).r
            ) * 0.25;
            
            /* change the velocity to move toward the average */
            info.g += (average - info.r) * 2.0;
            
            /* 减少衰减，让波浪持续更久 */
            info.g *= 0.998; 
            
            /* move the vertex along the velocity */
            info.r += info.g;
            
            gl_FragColor = info;
          }
        `,
      uniforms: {
        waterTexture: { value: null },
        delta: { value: new THREE.Vector2() },
        time: { value: 0.0 },
      },
    })

    // 法线着色器
    this.normalShader = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 coord;
        
        void main() {
          coord = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D waterTexture;
        uniform vec2 delta;
        varying vec2 coord;
        
        void main() {
          /* get vertex info */
          vec4 info = texture2D(waterTexture, coord);
          
          /* update the normal */
          vec3 dx = vec3(delta.x, texture2D(waterTexture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
          vec3 dy = vec3(0.0, texture2D(waterTexture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
          info.ba = normalize(cross(dy, dx)).xz;
          
          gl_FragColor = info;
        }
      `,
      uniforms: {
        waterTexture: { value: null },
        delta: { value: new THREE.Vector2() },
        time: { value: 0.0 },
      },
    })

    // 球体着色器
    this.sphereShader = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 coord;
        
        void main() {
          coord = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D waterTexture;
        uniform vec3 oldCenter;
        uniform vec3 newCenter;
        uniform float radius;
        varying vec2 coord;
        
        float volumeInSphere(vec3 center) {
          vec3 toCenter = vec3(coord.x * 2.0 - 1.0, 0.0, coord.y * 2.0 - 1.0) - center;
          float t = length(toCenter) / radius;
          float dy = exp(-pow(t * 1.5, 6.0));
          float ymin = min(0.0, center.y - dy);
          float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
          return (ymax - ymin) * 0.1;
        }
        
        void main() {
          /* get vertex info */
          vec4 info = texture2D(waterTexture, coord);
          
          /* add the old volume */
          info.r += volumeInSphere(oldCenter);
          
          /* subtract the new volume */
          info.r -= volumeInSphere(newCenter);
          
          gl_FragColor = info;
        }
      `,
      uniforms: {
        waterTexture: { value: null },
        oldCenter: { value: new THREE.Vector3() },
        newCenter: { value: new THREE.Vector3() },
        radius: { value: 0.0 },
      },
    })
  }

  private renderToTarget(target: THREE.WebGLRenderTarget, sourceTexture: THREE.Texture) {
    // 临时设置材质
    const originalMaterial = this.plane.material
    const tempMaterial = new THREE.MeshBasicMaterial({ map: sourceTexture })
    this.plane.material = tempMaterial

    // 渲染到目标
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)

    // 恢复原始材质
    this.plane.material = originalMaterial
    tempMaterial.dispose()
  }

  private renderWithShader(target: THREE.WebGLRenderTarget, sourceTexture: THREE.Texture, shader: THREE.ShaderMaterial) {
    // 设置着色器纹理
    shader.uniforms.waterTexture.value = sourceTexture

    // 临时设置材质
    const originalMaterial = this.plane.material
    this.plane.material = shader

    // 渲染到目标
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)

    // 恢复原始材质
    this.plane.material = originalMaterial
  }

  private swapTextures() {
    const temp = this.renderTargetA
    this.renderTargetA = this.renderTargetB
    this.renderTargetB = temp
  }

  // 添加水滴效果
  addDrop(x: number, y: number, radius: number, strength: number) {
    this.dropShader.uniforms.center.value.set(x, y)
    this.dropShader.uniforms.radius.value = radius
    this.dropShader.uniforms.strength.value = strength

    this.renderWithShader(this.renderTargetB, this.renderTargetA.texture, this.dropShader)
    this.swapTextures()
  }

  // 移动球体
  moveSphere(oldCenter: THREE.Vector3, newCenter: THREE.Vector3, radius: number) {
    this.sphereShader.uniforms.oldCenter.value.copy(oldCenter)
    this.sphereShader.uniforms.newCenter.value.copy(newCenter)
    this.sphereShader.uniforms.radius.value = radius

    this.renderWithShader(this.renderTargetB, this.renderTargetA.texture, this.sphereShader)
    this.swapTextures()
  }

  // 模拟步进
  stepSimulation(time: number = 0) {
    const delta = new THREE.Vector2(
      1.0 / this.renderTargetA.width,
      1.0 / this.renderTargetA.height,
    )
    this.updateShader.uniforms.delta.value.copy(delta)
    this.updateShader.uniforms.time.value = time

    this.renderWithShader(this.renderTargetB, this.renderTargetA.texture, this.updateShader)
    this.swapTextures()
  }

  // 更新法线
  updateNormals() {
    const delta = new THREE.Vector2(
      1.0 / this.renderTargetA.width,
      1.0 / this.renderTargetA.height,
    )
    this.normalShader.uniforms.delta.value.copy(delta)

    this.renderWithShader(this.renderTargetB, this.renderTargetA.texture, this.normalShader)
    this.swapTextures()
  }

  // 更新（完整的模拟循环）
  update(time: number = 0) {
    this.stepSimulation(time)
    this.updateNormals()
  }

  // 获取纹理（兼容 renderer.ts 接口）
  get textureA(): THREE.Texture {
    return this.renderTargetA.texture
  }

  get textureB(): THREE.Texture {
    return this.renderTargetB.texture
  }

  // 清理资源
  dispose() {
    this.renderTargetA.dispose()
    this.renderTargetB.dispose()
    this.dropShader.dispose()
    this.updateShader.dispose()
    this.normalShader.dispose()
    this.sphereShader.dispose()
  }
}

export default Water
