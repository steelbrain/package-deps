/* @flow */

import fs from 'sb-fs'
import Path from 'path'
import semverSatisfies from 'semver/functions/satisfies'
import type { Dependency } from './types'

const DEPENDENCY_REGEX_VERSION = /(.*?):.*/
const DEPENDENCY_REGEX_GIRURL = /(.*?)#.*/

export async function getDependencies(packageName: string): Promise<Array<Dependency>> {
  const packageModule = atom.packages.getLoadedPackage(packageName)
  const packageDependencies = packageModule && packageModule.metadata['package-deps']

  if (!Array.isArray(packageDependencies)) {
    console.error(`[Package-Deps] Unable to get loaded package '${packageName}'`)
    return []
  }
  return (await Promise.all(
    packageDependencies.map(async function(entry) {
      let url = null
      let name = entry
      let version = null

      const matchVersion = DEPENDENCY_REGEX_VERSION.exec(entry)
      const matchGiturl = DEPENDENCY_REGEX_GIRURL.exec(entry)
      if (matchVersion) {
        ;[, name, version] = matchVersion
      } else if (matchGiturl) {
        ;[, name, url] = matchGiturl
      } else {
        name = entry
      }

      if (__steelbrain_package_deps.has(name)) {
        return null
      }

      const resolvedPath = atom.packages.resolvePackagePath(name)
      if (resolvedPath) {
        if (!version) {
          return null
        }

        const manifest = JSON.parse(await fs.readFile(Path.join(resolvedPath, 'package.json')))
        // $FlowIgnore: Flow is paranoid, this parsed.version is NOT NULL
        if (semverSatisfies(manifest.version, `>=${version}`)) {
          return null
        }
      }
      __steelbrain_package_deps.add(name)

      return { name, url }
    }),
  )).filter(Boolean)
}
