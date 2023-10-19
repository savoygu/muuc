import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  externals: [
    'scss',
    'tailwindcss',
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
