/* @flow */

import FS from 'sb-fs'
import Path from 'path'
import semver from 'semver'
import { exec } from 'sb-exec'
import type { Dependency } from './types'

let shownStorageInfo = false
const VALID_TICKS = new Set(['✓', 'done'])
const VALIDATION_REGEXP = /(?:Installing|Moving) (.*?) to .* (.*)/

export function apmInstall(dependencies: Array<Dependency>, progressCallback: ((packageName: string, status: boolean) => void)): Promise<Map<string, Error>> {
  const errors = new Map()
  return Promise.all(dependencies.map(function(dep) {
    return exec(atom.packages.getApmPath(), ['install', dep.version ? `${dep.url}@${dep.version}` : dep.url, '--production', '--color', 'false'], {
      stream: 'both',
      ignoreExitCode: true,
    }).then(function(output) {
      const successful = VALIDATION_REGEXP.test(output.stdout) && VALID_TICKS.has(VALIDATION_REGEXP.exec(output.stdout)[2])
      progressCallback(dep.name, successful)
      if (!successful) {
        const error = new Error(`Error installing dependency: ${dep.name}`)
        error.stack = output.stderr
        throw error
      }
    }).catch(function(error) {
      errors.set(dep.name, error)
    })
  })).then(function() {
    return errors
  })
}

export async function enablePackage(packageName: string): Promise<void> {
  if (atom.packages.isPackageDisabled(packageName)) {
    atom.packages.enablePackage(packageName)
  }
  if (!atom.packages.isPackageLoaded(packageName)) {
    atom.packages.loadPackage(packageName)
  }
  if (!atom.packages.isPackageActive(packageName)) {
    await atom.packages.activatePackage(packageName)
  }
}

const DEPENDENCY_REGEX = /^([^#:]+)(?:#([^:]+))?(?::(.+))?$/
export async function getDependencies(packageName: string): Promise<Array<Dependency>> {
  const toReturn = []
  const packageModule = atom.packages.getLoadedPackage(packageName)
  const packageDependencies = packageModule && packageModule.metadata['package-deps']

  if (packageDependencies) {
    for (const entry of (packageDependencies: Array<string>)) {
      const matches = DEPENDENCY_REGEX.exec(entry)
      if (matches === null) {
        console.error('[Package-Deps] Error parsing dependency of', packageName, 'with value:', entry)
        continue
      }
      const parsed = {
        name: matches[1],
        url: matches[2] || matches[1],
        version: matches[3] || null,
      }
      if (__steelbrain_package_deps.has(parsed.name)) continue
      const resolvedPath = atom.packages.resolvePackagePath(parsed.name)
      if (resolvedPath) {
        if (!parsed.version) continue
        // eslint-disable-next-line no-await-in-loop
        const manifest = JSON.parse(await FS.readFile(Path.join(resolvedPath, 'package.json')))
        if (semver.satisfies(manifest.version, `>=${parsed.version}`)) continue
      }
      __steelbrain_package_deps.add(parsed.name)
      toReturn.push(parsed)
    }
  } else {
    console.error(`[Package-Deps] Unable to get loaded package '${packageName}'`)
  }

  return toReturn
}

export async function promptUser(packageName: string, dependencies: Array<Dependency>): Promise<'Yes' | 'No' | 'Never'> {
  const oldConfigPath = Path.join(atom.getConfigDirPath(), 'package-deps-state.json')
  let ignoredPackages = atom.config.get('atom-package-deps.ignored')

  if (await FS.exists(oldConfigPath)) {
    const oldConfig = JSON.parse(await FS.readFile(oldConfigPath, 'utf8'))
    atom.config.set('atom-package-deps.ignored', ignoredPackages = oldConfig.ignored)
    await FS.unlink(oldConfigPath)
  }

  if (ignoredPackages.includes(packageName)) {
    return 'No'
  }

  return new Promise(function(resolve) {
    const notification = atom.notifications.addInfo(`${packageName} needs to install dependencies`, {
      dismissable: true,
      icon: 'cloud-download',
      detail: dependencies.map(e => e.name).join(', '),
      description: `Install dependenc${dependencies.length === 1 ? 'y' : 'ies'}?`,
      buttons: [{
        text: 'Yes',
        onDidClick: () => {
          resolve('Yes')
          notification.dismiss()
        },
      }, {
        text: 'No Thanks',
        onDidClick: () => {
          resolve('No')
          notification.dismiss()
        },
      }, {
        text: 'Never',
        onDidClick: () => {
          ignoredPackages.push(packageName)
          atom.config.set('atom-package-deps.ignored', ignoredPackages)
          if (!shownStorageInfo) {
            shownStorageInfo = true
            atom.notifications.addInfo('How to reset package-deps memory', {
              dismissable: true,
              description: "To modify the list of ignored files invoke 'Application: Open Your Config' and change the 'atom-package-deps' section",
            })
          }
          resolve('Never')
          notification.dismiss()
        },
      }],
    })
    notification.onDidDismiss(() => resolve('No'))
  })
}
