import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'lib',
        format: 'cjs',
        sourcemap: false,
      },
    ],
    external: ['child_process', 'os', 'path', 'fs', 'semver/functions/satisfies', 'escape-html', 'p-map', 'p-filter'],
    plugins: [
      commonjs(),
      babel({
        extensions: ['.ts'],
        babelHelpers: 'bundled',
      }),
      resolve({ extensions: ['.ts'], preferBuiltins: true }),
    ],
  },
]
