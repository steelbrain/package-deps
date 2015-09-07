'use babel'
const FS = require('fs')
const Path = require('path')
const Helpers = require('atom-linter')
const View = require('./view')

window.__sb_package_deps = window.__sb_package_deps || []

export default class PackageDeps{
  static install(packageName) {
    if (!packageName) throw new Error('packageName is required')

    const packageDeps = atom.packages.getLoadedPackage(packageName).metadata['package-deps'] || []
    const packagesToInstall = []
    packageDeps.forEach(function(name) {
      if (__sb_package_deps.indexOf(name) === -1) {
        __sb_package_deps.push(name)
        if (!atom.packages.resolvePackagePath(name)) {
          packagesToInstall.push(name)
        } else if(!atom.packages.getActivePackage(name)) {
          atom.packages.enablePackage(name)
          atom.packages.activatePackage(name)
        }
      }
    })
    if (packagesToInstall.length) {
      let APMPath = Path.dirname(process.execPath)
      if (process.platform === 'darwin') {
        APMPath = Path.join(APMPath, '..', '..', '..', '..')
      }
      APMPath = Path.join(APMPath, 'resources', 'app', 'apm', 'bin', 'apm')
      return PackageDeps.installPackage(packageName, packagesToInstall, APMPath)
    } else return Promise.resolve()
  }
  static installPackage(packageName, packageNames, APMPath) {
    const promises = []
    const view = new View(packageName, packageNames)
    return view.createNotification().then(() => {
      packageNames.forEach(function(name) {
        promises.push(Helpers.exec(APMPath, ['install', name]))
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
}
