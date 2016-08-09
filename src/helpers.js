/* @flow */

import { exec } from 'sb-exec'

const VALID_TICKS = new Set(['✓', 'done'])
const VALIDATION_REGEXP = /(?:Installing|Moving) (.*?) to .* (.*)/

export function apmInstall(dependencies: Array<string>, progressCallback: ((packageName: string, status: boolean) => void)): Promise<Map<string, Error>> {
  const errors = new Map()
  return Promise.all(dependencies.map(function(dependency) {
    return exec(atom.packages.getApmPath(), ['install', dependency, '--production', '--color', 'false'], {
      stream: 'both',
      ignoreExitCode: true,
    }).then(function(output) {
      const successful = VALIDATION_REGEXP.test(output.stdout) && VALID_TICKS.has(VALIDATION_REGEXP.exec(output.stdout)[2])
      progressCallback(dependency, successful)
      if (!successful) {
        const error = new Error(`Error installing dependency: ${dependency}`)
        error.stack = output.stderr
        throw error
      }
    }).catch(function(error) {
      errors.set(dependency, error)
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

export function getDependencies(packageName: string): Array<string> {
  const toReturn = []
  const packageModule = atom.packages.getLoadedPackage(packageName)
  const packageDependencies = packageModule && packageModule.metadata['package-deps']

  if (packageDependencies) {
    for (const entry of (packageDependencies: Array<string>)) {
      if (__steelbrain_package_deps.has(entry) || atom.packages.resolvePackagePath(entry)) {
        continue
      }
      __steelbrain_package_deps.add(entry)
      toReturn.push(entry)
    }
  } else {
    console.error(`[Package-Deps] Unable to get loaded package '${packageName}'`)
  }

  return toReturn
}
