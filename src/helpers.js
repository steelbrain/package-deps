/* @flow */

import fs from 'sb-fs'
import Path from 'path'
import semverSatisfies from 'semver/functions/satisfies'
import { BufferedProcess } from 'atom'
import type { Dependency } from './types'

let shownStorageInfo = false
const VALID_TICKS = new Set(['✓', 'done'])
const VALIDATION_REGEXP = /(?:Installing|Moving) (.*?) to .* (.*)/

function exec(command: string, parameters: Array<string>): Promise<{ stdout: string, stderr: string }> {
  return new Promise(function(resolve) {
    const data = { stdout: [], stderr: [] }
    const spawnedProcess = new BufferedProcess({
      command,
      args: parameters,
      stdout(chunk) {
        data.stdout.push(chunk)
      },
      stderr(chunk) {
        data.stderr.push(chunk)
      },
      exit() {
        resolve({ stdout: data.stdout.join(''), stderr: data.stderr.join('') })
      },
      autoStart: false,
    })
    spawnedProcess.start()
  })
}

export function apmInstall(
  dependencies: Array<Dependency>,
  progressCallback: (packageName: string, status: boolean) => void,
): Promise<Map<string, Error>> {
  const errors = new Map()
  return Promise.all(
    dependencies.map(function(dep) {
      return exec(atom.packages.getApmPath(), ['install', dep.url || dep.name, '--production', '--color', 'false'])
        .then(function(output) {
          let successful = VALIDATION_REGEXP.test(output.stdout)
          if (successful) {
            const match = VALIDATION_REGEXP.exec(output.stdout)
            successful = match && VALID_TICKS.has(match[2])
          }
          progressCallback(dep.name, !!successful)
          if (!successful) {
            const error = new Error(`Error installing dependency: ${dep.name}`)
            error.stack = output.stderr
            throw error
          }
        })
        .catch(function(error) {
          errors.set(dep.name, error)
        })
    }),
  ).then(function() {
    return errors
  })
}

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
