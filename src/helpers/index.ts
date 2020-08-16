import semverSatisfies from 'semver/functions/satisfies'

import { IS_ATOM } from '../constants'
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

const getInstalledDependencyVersion: (dependency: DependencyResolved) => Promise<string | null> = async function (
  dependency: DependencyResolved,
) {
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

export const getDependencies: (name: string) => Promise<(Dependency | Dependency[])[]> = IS_ATOM
  ? getDependenciesAtom
  : getDependenciesNode
export const resolveDependencyPath: (name: string) => Promise<string | null> = IS_ATOM
  ? resolveDependencyPathAtom
  : resolveDependencyPathNode

export function invariant(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message ?? 'Invariant violation')
  }
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
