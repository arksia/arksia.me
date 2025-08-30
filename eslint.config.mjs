import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  ignores: [
    'src/pages/**/*.md',
  ],
})
