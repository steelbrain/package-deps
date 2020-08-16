import { DependencyResolved } from '../types'

export async function confirmPackagesToInstall({
  dependencies,
}: {
  packageName: string
  dependencies: (DependencyResolved | DependencyResolved[])[]
}): Promise<DependencyResolved[]> {
  // No user interaction on the CLI. Install the first (aka "default" choice) package
  return dependencies.map((item) => (Array.isArray(item) ? item[0] : item))
}

export function getView({
  dependencies,
}: {
  packageName: string
  dependencies: DependencyResolved[]
}): {
  handleFailure: (args: { dependency: DependencyResolved; error: Error }) => void
  handleDependencyInstalled: (dependency: DependencyResolved) => void
  handleComplete: () => void
} {
  let failed = false
  console.log(`Installing dependencies:\n${dependencies.map((item) => `  - ${item.name}`).join('\n')}`)

  return {
    handleFailure({ dependency, error }: { dependency: DependencyResolved; error: Error }): void {
      failed = true
      console.error(`Unable to install ${dependency.name}, Error:`, error?.stack ?? error)
    },
    handleDependencyInstalled(dependency: DependencyResolved): void {
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
