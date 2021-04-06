import type { Package, PackageManager } from 'atom'

// TODO upstream these changes to @types/atom

declare module 'atom/src/package' {
  interface Package {
    metadata: Record<string, any>
  }
}

declare module 'atom/src/package-manager' {
  interface PackageManager {
    resolvePackagePath(name: string): string | null
  }
}
