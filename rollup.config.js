import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import peerexternal from 'rollup-plugin-peer-deps-external'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'

const plugins = [
  babel(),

  peerexternal({
    includeDependencies: false,
  }),

  // so Rollup can find externals
  resolve({ extensions: ['.js'], preferBuiltins: true }),

  // so Rollup can convert externals to an ES module
  commonjs(),
]

// minify only in production mode
if (process.env.NODE_ENV === 'production') {
  plugins.push(
    // minify
    terser({
      ecma: 2018,
      warnings: true,
      compress: {
        drop_console: true,
      },
    }),
  )
}

export default [
  {
    input: 'src/index.js',
    output: [
      {
        dir: 'lib',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    // loaded externally
    external: ['atom'],
    plugins: plugins,
  },
]
