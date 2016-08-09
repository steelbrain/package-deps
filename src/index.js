/* @flow */

import invariant from 'assert'
import * as AtomPackagePath from 'atom-package-path'

import * as Helpers from './helpers'
import View from './view'

if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

async function install(givenPackageName: ?string) {
  const packageName = givenPackageName || AtomPackagePath.guessFromCallIndex(5)
  invariant(packageName, '[Package-Deps] Failed to determine package name')

  const dependencies = Helpers.getDependencies(packageName)
  if (!dependencies.length) {
    return
  }
  await Helpers.enablePackage('notifications')
  const view = new View(packageName, dependencies)
  const errors = await Helpers.apmInstall(dependencies, function() {
    view.advance()
  })
  const promises = []
  view.complete(errors)
  for (const dependency of (dependencies: Array<string>)) {
    if (errors.has(dependency)) {
      continue
    }
    promises.push(atom.packages.activatePackage(dependency))
  }
  await Promise.all(promises)
}

module.exports.install = install
