/* @flow */

import invariant from 'assert'
import * as AtomPackagePath from 'atom-package-path'

import * as Helpers from './helpers'
import View from './view'
import type { Dependency } from './types'

if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

async function installDependencies(packageName: ?string): Promise<void> {
  invariant(packageName, '[Package-Deps] Failed to determine package name')

  let dependencies = Helpers.getDependencies(packageName)
  if (!dependencies.length) {
    return
  }
  await Helpers.enablePackage('notifications')

  const notification = atom.notifications.addInfo(`${packageName} needs to install dependencies`, {
    dismissable: true,
    icon: 'cloud-download',
    detail: dependencies.map(e => e.name).join(', '),
    description: `Install dependenc${dependencies.length === 1 ? 'y' : 'ies'}?`,
    buttons: [{
      text: 'Yes',
      onDidClick: async () => {
        notification.dismiss()
        const view = new View(packageName, dependencies)
        const errors = await new Promise(function(resolve) {
          Helpers.apmInstall(dependencies, function() {
            resolve(view.advance())
          })
        })
        const promises = []
        view.complete(errors)
        for (const dependency of (dependencies: Array<Dependency>)) {
          if (errors.has(dependency.name)) {
            continue
          }
          promises.push(atom.packages.activatePackage(dependency.name))
        }
        console.log('finished installing package');
        await Promise.all(promises)
      },
    }, {
      text: 'No Thanks',
      onDidClick: () => {
        notification.dismiss()
      },
    }],
  })
}

function install(givenPackageName: ?string) {
  // NOTE: We are wrapping the async function in a sync function to avoid extra
  // stack values before we extract names
  return installDependencies(givenPackageName || AtomPackagePath.guessFromCallIndex(2))
}

export default install
export { install }
