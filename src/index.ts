import pFilter from 'p-filter'
import { invariant, getDependencies, resolveDependencyPath, shouldInstallDependency } from './helpers'
import { DependencyResolved } from './types'

type DependenciesResolved = (DependencyResolved | DependencyResolved[])[]

export async function install({
  packageName,
  showPrompt = true,
}: {
  packageName: string
  showPrompt?: boolean
}): Promise<void> {
  invariant(typeof packageName === 'string' && packageName.length > 0, '[Package-Deps] Package name is required')

  // Get list of relevant dependencies
  const dependencies = await getDependencies(packageName)

  if (dependencies.length === 0) {
    // Short-circuit
    return
  }

  // Resolve directories of relevant dependencies
  const resolvedDependencies: DependenciesResolved = await Promise.all(
    dependencies.map(async (item) => {
      if (Array.isArray(item)) {
        return Promise.all(
          item.map(async (subitem) => ({
            ...subitem,
            directory: await resolveDependencyPath(subitem.name),
          })),
        )
      }

      return { ...item, directory: await resolveDependencyPath(item.name) }
    }),
  )

  // Filter out already installed, in range dependencies
  // If one dependency from a group is already installed, whole group is ignored
  const dependenciesToInstall = await pFilter(resolvedDependencies, async function (item) {
    if (Array.isArray(item)) {
      return (await Promise.all(item.map((subitem) => shouldInstallDependency(subitem)))).every(Boolean)
    }
    return shouldInstallDependency(item)
  })

  console.log('dependenciesToInstall', dependenciesToInstall)
}
