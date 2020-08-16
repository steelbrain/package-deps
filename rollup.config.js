import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import preserveShebang from 'rollup-plugin-preserve-shebang'

const mainFile = {
  input: 'src/index.ts',
  output: {
    file: 'lib/index.js',
    format: 'cjs',
  },
  external: ['child_process', 'os', 'path', 'fs'],
  plugins: [
    commonjs(),
    preserveShebang(),
    babel({
      extensions: ['.ts'],
      babelHelpers: 'bundled',
    }),
    resolve({ extensions: ['.ts', '.js'], preferBuiltins: true }),
  ],
}

const binFile = {
  input: 'src/bin.ts',
  output: {
    file: 'lib/bin.js',
    format: 'cjs',
  },
  external: ['child_process', 'os', 'path', 'fs', './index'],
  plugins: [
    commonjs(),
    preserveShebang(),
    babel({
      extensions: ['.ts'],
      babelHelpers: 'bundled',
    }),
  ],
}

export default [binFile, mainFile]
