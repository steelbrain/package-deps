/* @flow */

import invariant from 'assert'
import AtomPackagePath from 'atom-package-path'

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
  view.complete(await Helpers.apmInstall(dependencies, function() {
    view.advance()
  }))
}

module.exports.install = install
