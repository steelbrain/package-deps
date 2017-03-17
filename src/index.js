/* @flow */

import invariant from 'assert'
import * as AtomPackagePath from 'atom-package-path'

import * as Helpers from './helpers'
import View from './view'
import type { Dependency } from './types'

if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

async function installDependencies(packageName: string, promptUser: boolean): Promise<void> {
  invariant(packageName, '[Package-Deps] Failed to determine package name')

  const dependencies = await Helpers.getDependencies(packageName)
  if (!dependencies.length) {
    return
  }
  await Helpers.enablePackage('notifications')

  if (promptUser) {
    const choice = await Helpers.promptUser(packageName, dependencies)
    if (choice !== 'Yes') {
      return
    }
  }

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

function install(givenPackageName: ?string = null, promptUser: boolean = false) {
  // NOTE: We are wrapping the async function in a sync function to avoid extra
  // stack values before we extract names
  return installDependencies(givenPackageName || AtomPackagePath.guessFromCallIndex(2), promptUser)
}

export default install
export { install }
