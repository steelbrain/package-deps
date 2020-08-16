export const IS_ATOM = typeof atom !== 'undefined'
export const IS_DEV = typeof atom !== 'undefined' && (atom.inDevMode() || atom.inSpecMode())
