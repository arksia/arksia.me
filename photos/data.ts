export interface Photo {
  name: string
  url: string
}

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
    }
  })
  .sort((a, b) => b.name.localeCompare(a.name))

export default photos
