export interface PhotoMate {
  ImageWidth?: number
  ImageHeight?: number
}

export interface Photo extends PhotoMate {
  name: string
  url: string
}

const metaInfo = Object.entries(
  import.meta.glob<PhotoMate>('./**/*.json', {
    eager: true,
    import: 'default',
  }),
).map(([name, data]) => {
  name = name.replace(/\.\w+$/, '').replace(/^\.\//, '')
  return {
    name,
    data,
  }
})

const photos = Object.entries(
  import.meta.glob<string>('./**/*.{jpg,png,JPG,PNG}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)
  .map(([name, url]): Photo => {
    name = name.replace(/\.\w+$/, '').replace(/^\.\//, '')
    return {
      name,
      url,
      ...metaInfo.find(item => item.name === name)?.data,
    }
  })
  .sort((a, b) => b.name.localeCompare(a.name))

export default photos
