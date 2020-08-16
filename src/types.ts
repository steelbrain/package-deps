export interface Dependency {
  name: string
  version?: string | null
}

export interface DependencyResolved extends Dependency {
  directory: string | null
}
