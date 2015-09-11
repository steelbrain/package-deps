'use babel'
const FS = require('fs')
const Path = require('path')
const View = require('./view')
import {exec} from './helper'

window.__sb_package_deps = window.__sb_package_deps || []

export function install(packageName, enablePackages = true) {
  if (!packageName) throw new Error('packageName is required')

  const packageDeps = atom.packages.getLoadedPackage(packageName).metadata['package-deps'] || []
  const packagesToInstall = []
  packageDeps.forEach(function(name) {
    if (__sb_package_deps.indexOf(name) === -1) {
      __sb_package_deps.push(name)
      if (!atom.packages.resolvePackagePath(name)) {
        packagesToInstall.push(name)
      } else if(!atom.packages.getActivePackage(name) && enablePackages) {
        atom.packages.enablePackage(name)
        atom.packages.activatePackage(name)
      }
    }
  })
  if (packagesToInstall.length) {
    return installPackage(packageName, packagesToInstall)
  } else return Promise.resolve()
}

export function installPackage(packageName, packageNames) {
  const APMPath = atom.packages.getApmPath()
  const promises = []
  const view = new View(packageName, packageNames)
  return view.createNotification().then(() => {
    packageNames.forEach(function(name) {
      promises.push(exec(APMPath, ['install', name, '--production']))
    })
    return Promise.all(promises)
  }).then(function(outputs){
    outputs.forEach(function(output, index) {
      const name = packageNames[index]
      if (output.indexOf('✓') === -1 && output.indexOf('[32mdone') === -1) {
        view.markErrored(name, output)
      } else {
        atom.packages.enablePackage(name)
        atom.packages.activatePackage(name)
        view.markFinished()
      }
    })
  })
}
