jasmine.getEnv().defaultTimeoutInterval = 360 * 1000
describe 'Package-Deps', ->
  CP = require('child_process')
  CP.execSync("#{atom.packages.getApmPath()} uninstall vim-mode pigments test-dependent-package")
  CP.execSync("#{atom.packages.getApmPath()} install test-dependent-package")
  atom.packages.activatePackage('test-dependent-package')
  {Emitter} = require('event-kit')
  PackageDeps = require('../lib/main')

  beforeEach ->
    global.setTimeout = require('remote').getGlobal('setTimeout')
    console.log(setTimeout)
    PackageDeps.debug?.dispose()
    PackageDeps.debug = new Emitter

    waitsForPromise ->
      atom.packages.activatePackage('notifications')

  it 'installs dependencies', ->
    waitsForPromise ->
      packagesToInstall = null
      packagesInstalled = 0
      PackageDeps.debug.on('packagesToInstall', (packages)->
        packagesToInstall = packages
      )
      PackageDeps.debug.on('installPackage', ->
        packagesInstalled++
        console.log(packagesInstalled)
      )
      PackageDeps.install('test-dependent-package').then( ->
        expect(packagesToInstall instanceof Array).toBe(true)
        expect(packagesToInstall.length).toBe(packagesInstalled)
        packagesToInstall.forEach((name) ->
          expect(atom.packages.getActivePackage(name)).toBeDefined()
        )
      )
