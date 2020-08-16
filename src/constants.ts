export const IS_ATOM = typeof atom !== 'undefined'
export const IS_DEV = typeof atom !== 'undefined' && (atom.inDevMode() || atom.inSpecMode())
export const IGNORED_CONFIG_NAME = 'atom-package-deps.ignored'
