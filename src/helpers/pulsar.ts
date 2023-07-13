import { Dependency, DependencyResolved } from '../types'

export async function getDependencies(packageName: string): Promise<(Dependency | Dependency[])[]> {
  const packageModule = atom.packages.getLoadedPackage(packageName)
  const packageDependencies = packageModule && packageModule.metadata['package-deps']

  return Array.isArray(packageDependencies) ? packageDependencies : []
}

export async function resolveDependencyPath(packageName: string): Promise<string | null> {
  return atom.packages.resolvePackagePath(packageName)
}

export async function getInstalledDependencyVersion(dependency: DependencyResolved): Promise<string | null> {
  const packageModule = atom.packages.getLoadedPackage(dependency.name)

  return packageModule == null ? null : packageModule.metadata.version ?? null
}
