'use babel'

import {BufferedProcess} from 'atom'

export function installPackages(packageNames, callback) {
  return new Promise(function(resolve, reject) {
    const stdErr = []
    new BufferedProcess({
      command: atom.packages.getApmPath(),
      args: ['--production', 'install'].concat(packageNames),
      options: {},
      stdout: function(contents) {
        console.log(contents)
      },
      stderr: function(contents) {
        stdErr.push(contents)
      },
      exit: function() {
        if (stdErr.length) {
          return reject(new Error(stdErr.join('')))
        } else resolve()
      }
    })
  })
}
