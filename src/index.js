/* @flow */

import invariant from 'assert'
import * as AtomPackagePath from 'atom-package-path'

import * as Helpers from './helpers'
import View from './view'
import type { Dependency } from './types'

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
  for (const dependency of (dependencies: Array<Dependency>)) {
    if (errors.has(dependency.name)) {
      continue
    }
    promises.push(atom.packages.activatePackage(dependency.name))
  }
  await Promise.all(promises)
}

module.exports.install = install
