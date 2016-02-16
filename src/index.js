'use strict'

import {getDependencies, installDependencies} from './helpers'

if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

export async function install(name = null) {
  if (!name) {
    name = require('atom-package-path').guessFromCallIndex(5)
  }
  if (!name) {
    console.log(`Unable to get package name for file: ${filePath}`)
    return
  }

  const dependencies = getDependencies(name)
  if (dependencies.length) {
    await atom.packages.activatePackage('notifications')
    await installDependencies(name, dependencies)
  }
}
