import { spawn } from '@steelbrain/spawn'
import semverSatisfies from 'semver/functions/satisfies'

import { IS_ATOM, IS_DEV, IGNORED_CONFIG_NAME } from '../constants'
import { DependencyResolved, Dependency } from '../types'

import {
  getDependencies as getDependenciesAtom,
  resolveDependencyPath as resolveDependencyPathAtom,
  getInstalledDependencyVersion as getInstalledDependencyVersionAtom,
} from './atom'
import {
  getDependencies as getDependenciesNode,
  resolveDependencyPath as resolveDependencyPathNode,
  getInstalledDependencyVersion as getInstalledDependencyVersionNode,
} from './node'

/**
 * Internal helpers
 */

const versionInRangeCache: Map<string, boolean> = new Map()
function versionInRange({ version, range }: { version: string; range: string }): boolean {
  const cacheKey = `$${version}$${range}`
  const cached = versionInRangeCache.get(cacheKey)

  if (cached != null) {
    return cached
  }
  const matches = semverSatisfies(version, range)
  versionInRangeCache.set(cacheKey, matches)

  return matches
}

async function getInstalledDependencyVersion(dependency: DependencyResolved): Promise<string | null> {
  if (IS_ATOM) {
    const atomPackageVersion = await getInstalledDependencyVersionAtom(dependency)

    if (atomPackageVersion) {
      return atomPackageVersion
    }
    // If the package isn't activated, it won't be loaded, so fallback to reading manifest file instead
  }

  return getInstalledDependencyVersionNode(dependency)
}

/**
 * Exported helpers
 */

export const resolveDependencyPath: (name: string) => Promise<string | null> = IS_ATOM
  ? resolveDependencyPathAtom
  : resolveDependencyPathNode

export function invariant(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message ?? 'Invariant violation')
  }
}

export async function getDependencies(name: string): Promise<(Dependency | Dependency[])[]> {
  const dependencies = await (IS_ATOM ? getDependenciesAtom(name) : getDependenciesNode(name))

  if (IS_DEV) {
    invariant(Array.isArray(dependencies), `Dependencies for ${name} are not a valid array`)

    dependencies.forEach((item, index) => {
      if (Array.isArray(item)) {
        item.forEach((subitem, subindex) => {
          const invalidMessage = `Dependency#${index}#${subindex} for ${name} is invalid`
          invariant(typeof subitem.name === 'string' && subitem.name.length > 0, invalidMessage)
          invariant(
            subitem.version == null || (typeof subitem.version === 'string' && subitem.version.length > 0),
            invalidMessage,
          )
        })
        invariant(item.length > 0, `Dependency#${index} for ${name} has no group items`)
      } else {
        const invalidMessage = `Dependency#${index} for ${name} is invalid`
        invariant(typeof item.name === 'string' && item.name.length > 0, invalidMessage)
        invariant(item.version == null || (typeof item.version === 'string' && item.version.length > 0), invalidMessage)
      }
    })
  }

  return dependencies
}

export async function shouldInstallDependency(dependency: DependencyResolved) {
  if (dependency.directory == null) {
    // Not installed, so install
    return true
  }
  if (dependency.version == null) {
    // Already installed and no version defined, so skip
    return false
  }

  const version = await getInstalledDependencyVersion(dependency)

  if (version == null) {
    // Unable to get current version, so install
    return true
  }

  return !versionInRange({
    version,
    range: dependency.version,
  })
}

export function isPackageIgnored(name: string): boolean {
  if (!IS_ATOM) {
    // Never ignored in CLI
    return false
  }

  const ignoredPackages = atom.config.get(IGNORED_CONFIG_NAME) ?? []
  if (ignoredPackages.includes(name)) {
    return true
  }

  // If Atom "notifications" package is disabled, treat the whole thing as ignored
  if (atom.packages.isPackageDisabled('notifications')) {
    console.warn(`Enable notifications to install dependencies for ${name}`)
    return true
  }

  return false
}

export function markPackageAsIgnored(name: string): void {
  if (!IS_ATOM) {
    // No op in CLI
    return
  }
  const ignoredPackages = new Set(atom.config.get(IGNORED_CONFIG_NAME) ?? [])
  ignoredPackages.add(name)
  atom.config.set(IGNORED_CONFIG_NAME, Array.from(ignoredPackages))
}

const INSTALL_VALID_TICKS = new Set(['✓', 'done'])
const INSTALL_VALIDATION_REGEXP = /(?:Installing|Moving) (.*?) to .* (.*)/
// Example success output: Uninstalling linter-ui-default ✓
export async function installPackage(dependency: Dependency): Promise<void> {
  const apmPath = IS_ATOM ? atom.packages.getApmPath() : 'apm'

  const { stdout, stderr } = await spawn(apmPath, [
    'install',
    dependency.version ? `${dependency.name}@${dependency.version}` : dependency.name,
    '--production',
    '--color',
    'false',
  ])

  const match = INSTALL_VALIDATION_REGEXP.exec(stdout.trim())
  if (match != null && INSTALL_VALID_TICKS.has(match[2])) {
    // Installation complete and verified
    return
  }

  const error = new Error(`Error installing dependency: ${dependency.name}`)
  error.stack = stderr.trim()
  throw error
}
