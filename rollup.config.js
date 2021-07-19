import preserveShebang from 'rollup-plugin-preserve-shebang'
import { createPlugins } from 'rollup-plugin-atomic'

const plugins = (isAtom) =>
  createPlugins(
    [
      'js',
      ['ts', { tsconfig: './src/tsconfig.json' }, true],
      ['replace', { 'process.env.PACKAGE_DEPS_IS_ATOM': isAtom }, true],
    ],
    [preserveShebang()],
  )

const mainFile = {
  input: 'src/index.ts',
  output: {
    dir: './lib',
    format: 'cjs',
  },
  external: ['atom'],
  plugins: plugins('true'),
}

const binFile = {
  input: 'src/bin.ts',
  output: {
    dir: './lib',
    format: 'cjs',
  },
  plugins: plugins('false'),
}

export default [binFile, mainFile]
