import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  externals: [
    'tailwindcss',
    'postcss',
    'fast-glob',
  ],
  rollup: {
    emitCJS: true,
    // inlineDependencies: true,
  },
})
