import preserveShebang from 'rollup-plugin-preserve-shebang'
import { createPlugins } from 'rollup-plugin-atomic'

const plugins = createPlugins([['ts', { tsconfig: './src/tsconfig.json' }, true], 'js'], [preserveShebang()])

const mainFile = {
  input: 'src/index.ts',
  output: {
    dir: './lib',
    format: 'cjs',
  },
  external: ['atom'],
  plugins,
}

const binFile = {
  input: 'src/bin.ts',
  output: {
    dir: './lib',
    format: 'cjs',
  },
  external: ['./index'],
  plugins,
}

export default [binFile, mainFile]
