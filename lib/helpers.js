'use babel'

import {BufferedProcess} from 'atom'
const extractionRegex = /Installing (.*?) to .* (.*)/
const nameRegexes = [
  /(\\|\/)packages(\\|\/)(.*?)(\\|\/)/,
  /(\\|\/)([\w-_]+)(\\|\/)(lib|src)(\\|\/)/i,
  /(\\|\/)([\w-_]+)(\\|\/)[\w-_]+\..+$/
]

export function guessName(filePath) {
  let matches

  matches = nameRegexes[0].exec(filePath)
  if (matches) {
    return matches[3]
  }
  matches = nameRegexes[1].exec(filePath)
  if (matches) {
    return matches[2]
  }
  matches = nameRegexes[2].exec(filePath)
  if (matches) {
    return matches[2]
  }
  return null
}

export function installPackages(dependencies, progressCallback) {
  return new Promise(function(resolve, reject) {
    const errors = []
    new BufferedProcess({
      command: atom.packages.getApmPath(),
      args: ['install'].concat(dependencies).concat(['--production', '--color', 'false']),
      options: {},
      stdout: function(contents) {
        const matches = extractionRegex.exec(contents)
        atom.packages.activatePackage(matches[1])
        if (matches[2] === '✓' || matches[2] === 'done') {
          progressCallback(matches[1], true)
        } else {
          progressCallback(matches[1], false)
          errors.push(contents)
        }
      },
      stderr: function(contents) {
        errors.push(contents)
      },
      exit: function() {
        if (errors.length) {
          const error = new Error('Error installing dependencies')
          error.stack = errors.join('')
          reject(error)
        } else resolve()
      }
    })
  })
}

export function packagesToInstall(name) {
  let packageInfo = atom.packages.getLoadedPackage(name)

  const toInstall = [], toEnable = [];
  (packageInfo ? (packageInfo.metadata['package-deps'] ? packageInfo.metadata['package-deps'] : []) : [])
    .forEach(function(name) {
      if (!window.__steelbrain_package_deps.has(name)) {
        window.__steelbrain_package_deps.add(name)
        if (atom.packages.resolvePackagePath(name)) {
          toEnable.push(name)
        } else {
          toInstall.push(name)
        }
      }
    })

  return {toInstall, toEnable}
}
