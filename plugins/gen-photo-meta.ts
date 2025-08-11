import type { PluginOption } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import exifr from 'exifr'

async function generatePhotoMetadata(photosDir: string, filename: string) {
  try {
    const photoPath = path.join(photosDir, filename)
    const jsonPath = path.join(photosDir, `${path.parse(filename).name}.json`)

    // 解析EXIF数据
    const photoMate = await exifr.parse(photoPath)

    if (photoMate) {
      fs.writeFileSync(jsonPath, JSON.stringify(photoMate, null, 2), 'utf-8')
      console.warn(`✅ Generated metadata for: ${filename}`)
    }
  }
  catch (error) {
    console.error(`❌ Failed to generate metadata for ${filename}:`, error)
  }
}

// 生成所有图片的元数据
async function generateAllMetadata(photosDir: string) {
  try {
    if (!fs.existsSync(photosDir)) {
      console.warn(`⚠️ Path not found: ${photosDir}`)
      return
    }

    const photos = fs.readdirSync(photosDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
      .filter((file) => {
        const jsonPath = path.join(photosDir, `${path.parse(file).name}.json`)
        return !fs.existsSync(jsonPath)
      })

    if (photos.length > 0) {
      console.warn(`📸 Found ${photos.length} new photos in ${photosDir}`)

      for (const photo of photos) {
        await generatePhotoMetadata(photosDir, photo)
      }
    }
  }
  catch (error) {
    console.error('❌ Failed to generate metadata:', error)
  }
}

export default function genPhotoMate(photosPath: string): PluginOption {
  return {
    name: 'gen-photo-mate',
    enforce: 'pre',

    async buildStart() {
      const fullPhotosPath = path.join(process.cwd(), photosPath)
      await generateAllMetadata(fullPhotosPath)
    },

    handleHotUpdate({ file }) {
      const fullPhotosPath = path.join(process.cwd(), photosPath)
      if (file.includes(photosPath) && (file.endsWith('.jpg') || file.endsWith('.png'))) {
        const filename = path.basename(file)
        console.warn(`🔄 Photo updated: ${filename}`)

        generatePhotoMetadata(fullPhotosPath, filename)

        return []
      }
    },
  }
}
