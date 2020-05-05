/* @flow */

import { BufferedProcess } from 'atom'
import type { Dependency } from './types'
import { View } from './view'

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

function apmInstall(
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

export async function performInstall(packageName, dependencies): Promise[] {
  const view = new View(packageName, dependencies)
  const errors = await apmInstall(dependencies, function() {
    view.advance()
  })
  const promises = []
  view.complete(errors)
  for (const dependency of (dependencies: Array<Dependency>)) {
    if (errors.has(dependency.name)) {
      continue
    }
    promises.push(atom.packages.activatePackage(dependency.name))
  }
  return promises
}
