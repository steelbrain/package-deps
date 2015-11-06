'use babel'

import {BufferedProcess} from 'atom'
const extractionRegex = /Installing (.*?) to .*? (.*)/

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
