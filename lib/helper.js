'use babel'

import {BufferedProcess} from 'atom'

export function installPackages(packageNames, callback) {
  const APMPath = atom.packages.getApmPath()
  const Promises = []

  return Promise.all(Promise)
}
export function exec(command, args = [], options = {}) {
  if (!arguments.length) throw new Error('Nothing to execute')

  return new Promise(function(resolve, reject) {
    const data = {stdout: [], stderr: []}
    const spawnedProcess = new BufferedProcess({
      command: command,
      args: args,
      options: options,
      stdout: function(contents) {
        data.stdout.push(contents)
      },
      stderr: function(contents) {
        data.stderr.push(contents)
      },
      exit: function() {
        if (data.stderr.length) {
          reject(new Error(data.stderr.join('')))
        } else {
          resolve(data.stdout.join(''))
        }
      }
    })
    spawnedProcess.onWillThrowError(function({error, handle}) {
      reject(error)
      handle()
    })
  })
}
