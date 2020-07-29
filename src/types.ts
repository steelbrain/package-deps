export interface Dependency {
  name: string
  version?: string
}

export interface Helpers {
  getDependencies(name: string): Promise<(Dependency | Dependency[])[]>
  resolveDependencyPath(name: string): Promise<string | null>
}
