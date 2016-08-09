'use strict'

import {BufferedProcess} from 'atom'
import {View} from './view'
const extractionRegex = /Installing (.*?) to .* (.*)/

export function spawnAPM(dependencies, progressCallback) {
  return new Promise(function(resolve, reject) {
    const errors = []
    let successes = 0
    new BufferedProcess({
      command: atom.packages.getApmPath(),
      args: ['install'].concat(dependencies).concat(['--production', '--color', 'false']),
      options: {},
      stdout: function(contents) {
        const matches = extractionRegex.exec(contents)
        if (!matches) {
          // info messages: ignore
        } else if (matches[2] === '✓' || matches[2] === 'done') {
          progressCallback(matches[1], true)
          successes++
        } else {
          progressCallback(matches[1], false)
          errors.push(matches[1])
        }
      },
      stderr: function(contents) {
        errors.push(contents)
      },
      exit: function() {
        if (successes !== dependencies.length) {
          const error = new Error('Error installing dependencies')
          error.stack = errors.join('\n')
          reject(error)
        } else resolve()
      }
    })
  })
}

export async function installDependencies(name, packages) {
  const view = new View(name, packages)
  const installedPackages = []
  try {
    await spawnAPM(packages, function(name, status) {
      view.advance()
      if (status) {
        installedPackages.push(name)
      }
    })
    view.markFinished()
  } catch (error) {
    view.dismiss()
    atom.notifications.addError(`Error installing ${name} dependencies`, {
      detail: error.stack,
      dismissable: true
    })
  } finally {
    await Promise.all(installedPackages.map(name => atom.packages.activatePackage(name)))
  }
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
  } else {
    console.error(`[Package-Deps] Unable to get package info for ${name}`)
  }

  return toReturn
}
