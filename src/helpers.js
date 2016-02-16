'use strict'

import {BufferedProcess} from 'atom'
const extractionRegex = /Installing (.*?) to .* (.*)/

export function spawnAPM(dependencies, progressCallback) {
  return new Promise(function(resolve, reject) {
    const errors = []
    new BufferedProcess({
      command: atom.packages.getApmPath(),
      args: ['install'].concat(dependencies).concat(['--production', '--color', 'false']),
      options: {},
      stdout: function(contents) {
        const matches = extractionRegex.exec(contents)
        progressCallback()
        if (matches[2] === '✓' || matches[2] === 'done') {
          // Succeeded
        } else {
          errors.push(matches[1])
        }
      },
      stderr: function(contents) {
        const lastIndex = errors.length - 1
        errors[lastIndex] += ': ' + contents
      },
      exit: function() {
        if (errors.length) {
          const error = new Error('Error installing dependencies')
          error.stack = errors.join('\n')
          reject(error)
        } else resolve()
      }
    })
  })
}

export function getDependencies(name) {
  const toReturn = []
  const packageModule = atom.packages.getLoadedPackage(name)
  const packageDependencies = packageModule && packageModule.metadata['package-deps']

  if (packageDependencies) {
    for (const name of packageDependencies) {
      if (!__steelbrain_package_deps.has(name)) {
        __steelbrain_package_deps.add(name)
        if (!atom.packages.resolvePackagePath(name)) {
          toReturn.push(name)
        }
      }
    }
  }

  return toReturn
}
