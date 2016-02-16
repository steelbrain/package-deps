'use strict'

import {installPackages, getDependencies} from './helpers'

if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

export async function install(name = null) {
  if (!name) {
    // 5 is the callsite index when called due to this function being a generator
    name = require('atom-package-path').guessFromCallIndex(5)
  }
  if (!name) {
    console.log(`Unable to get package name for file: ${filePath}`)
    return
  }

  const dependencies = getDependencies(name)
  if (dependencies.length) {
    await atom.packages.activatePackage('notifications')
    console.log('packages to install', dependencies)
  }
}
