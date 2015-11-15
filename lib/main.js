'use babel'
const FS = require('fs')
const Path = require('path')
const {View} = require('./view')
import {installPackages, packagesToInstall} from './helpers'

// Renamed for backward compatibility
if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
}

export function install(name = null, enablePackages = false) {
  if (!name) {
    const chunks = __dirname.split(Path.sep)
    name = chunks[chunks.length - 4]
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
    promise = Promise.all([view.show(), promise]).then(function() {
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
