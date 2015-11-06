'use babel'
const FS = require('fs')
const Path = require('path')
const View = require('./view')
import installPackages from './install'

// Renamed for backward compatibility
if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

export function packagesToInstall(name) {
  let packageInfo = atom.packages.getLoadedPackage(name)

  const toInstall = [], toEnable = []
  (packageInfo ? (packageInfo.metadata['package-deps'] ? packageInfo.metadata['package-deps'] : []) : [])
    .forEach(function(name) {
      if (!__steelbrain_package_deps.has(name)) {
        __steelbrain_package_deps.add(name)
        if (atom.packages.resolvePackagePath(name)) {
          toEnable.push(name)
        } else {
          toInstall.push(name)
        }
      }
    })

  return {toInstall, toEnable}
}

export function install(name = null, enablePackages = false) {
  if (!name) {
    const chunks = __dirname.split(Path.sep)
    name = chunks[chunks.length - 3]
  }
  const {toInstall, toEnable} = packagesToInstall(name)
  let promise = Promise.resolve()

  if (enablePackages && toEnable.length) {
    promise = toEnable.reduce(function(promise, name) {
      atom.packages.enablePackage(name)
      return atom.packages.activatePackage(name)
    }, promise)
  }
  if (toInstall.length) {
    const view = new View(name, toInstall)
    view.show()
    promise = promise.then(function() {
      return installPackages(toInstall, function(name, status) {
        if (status) {
          view.advance()
        } else {
          atom.notifications.addError(`Error Installing ${name}`, {detail: 'Something went wrong. Try installing this package manually.'})
        }
      })
    })
  }

  return promise
}
