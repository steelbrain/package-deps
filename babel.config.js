module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { electron: 5 },
      },
    ],
    '@babel/preset-typescript',
  ],
  exclude: 'node_modules/**',
  sourceMaps: 'inline',
}
