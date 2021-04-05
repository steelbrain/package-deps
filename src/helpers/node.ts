import fs from 'fs'
import os from 'os'
import path from 'path'
import { Dependency, DependencyResolved } from '../types'

export async function getDependencies(packageName: string): Promise<(Dependency | Dependency[])[]> {
  let packageStats: fs.Stats | null = null

  try {
    packageStats = await fs.promises.stat(packageName)
  } catch (_) {
    // No Op
  }

  if (packageStats == null || !packageStats.isDirectory()) {
    throw new Error(`[Package-Deps] Expected packageName to be a readable directory in Node.js invocation`)
  }

  let parsed: Record<string, any> | null = null
  try {
    const contents = await fs.promises.readFile(path.join(packageName, 'package.json'), 'utf8')
    parsed = JSON.parse(contents)
  } catch (_) {
    // Ignore JSON read errors and such
  }
  const packageDependencies = parsed == null || typeof parsed !== 'object' ? [] : parsed['package-deps']

  return Array.isArray(packageDependencies) ? packageDependencies : []
}

export async function resolveDependencyPath(packageName: string): Promise<string | null> {
  const packageDirectory = path.join(getAtomHomePath(), 'packages', packageName)

  try {
    await fs.promises.access(packageDirectory, fs.constants.R_OK)
    return packageDirectory
  } catch (_) {
    return null
  }
}

/**
 * Get the atom home which includes `packages` folder.
 * Test runners such as `atom-jasmine3-runner` change this folder in the test env,
 * so we need to install packages in the correct path
 */
function getAtomHomePath() {
  return atom.getConfigDirPath() ?? process.env.ATOM_HOME ?? path.join(os.homedir(), '.atom')
}

export async function getInstalledDependencyVersion(dependency: DependencyResolved): Promise<string | null> {
  const { directory } = dependency

  if (directory == null) {
    // Not possible to get version without resolved directory in Node.js version
    return null
  }

  let manifest: Record<string, any> | null = null

  try {
    manifest = JSON.parse(await fs.promises.readFile(path.join(directory, 'package.json'), 'utf8'))
  } catch (_) {
    return null
  }

  return manifest?.version ?? null
}
