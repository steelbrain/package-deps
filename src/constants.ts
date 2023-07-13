export const IS_ATOM =
  typeof process.env.PACKAGE_DEPS_IS_ATOM === 'string'
    ? process.env.PACKAGE_DEPS_IS_ATOM === 'true'
    : typeof atom !== 'undefined'
export const IS_DEV = IS_ATOM && (atom.inDevMode() || atom.inSpecMode())
export const IGNORED_CONFIG_NAME = 'pulsar-package-deps.ignored'
