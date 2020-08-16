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

export default function getView({ packageName, dependencies }: { packageName: string; dependencies: Dependency[] }) {
  return {
    handleFailure(error: Error): void {},
    handleDependencyInstalled(dependencyName: string): void {},
  }
}
