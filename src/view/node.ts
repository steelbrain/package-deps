import { Dependency } from '../types'

export async function confirmPackagesToInstall({
  dependencies,
}: {
  packageName: string
  dependencies: (Dependency | Dependency[])[]
}): Promise<Dependency[]> {
  // No user interaction on the CLI. Install the first (aka "default" choice) package
  return dependencies.map((item) => (Array.isArray(item) ? item[0] : item))
}

export function getView({
  packageName,
  dependencies,
}: {
  packageName: string
  dependencies: Dependency[]
}): {
  handleFailure: (args: { dependency: Dependency; error: Error }) => void
  handleDependencyInstalled: (dependency: Dependency) => void
  handleComplete: () => void
} {
  let failed = false
  console.log(`Installing ${packageName} dependencies:\n${dependencies.map((item) => `  - ${item.name}`).join('\n')}`)

  return {
    handleFailure({ dependency, error }: { dependency: Dependency; error: Error }): void {
      failed = true
      console.error(`Unable to install ${dependency.name}, Error:`, error?.stack ?? error)
    },
    handleDependencyInstalled(dependency: Dependency): void {
      console.log('Successfully installed', dependency.name)
    },
    handleComplete() {
      console.log('Installation complete')

      if (failed) {
        // Fail the invocation
        process.exitCode = 1
      }
    },
  }
}
