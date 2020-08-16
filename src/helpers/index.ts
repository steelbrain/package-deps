import semverSatisfies from 'semver/functions/satisfies'

import { IS_ATOM, IS_DEV } from '../constants'
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

/* Exported stuff */

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
