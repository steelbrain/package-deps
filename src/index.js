/* @flow */

import invariant from 'assert'
import { getDependencies } from './check'

if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

async function installDependencies(packageName: string, promptUser: boolean = true): Promise<void> {
  invariant(packageName, '[Package-Deps] Package name is required')

  const dependencies = await Helpers.getDependencies(packageName)
  if (!dependencies.length) {
    return
  }

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

export { installDependencies as install }
