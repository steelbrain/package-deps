describe 'Package-Deps', ->

  window.__steelbrain_package_deps = new Set()

  describe '::packagesToInstall', ->
    it 'works', ->
      spyOn(atom.packages, 'getLoadedPackage').andReturn({
        metadata: {
          'package-deps': ['linter', 'atom-hack']
        }
      })
      atom.packages.resolvePackagePath.andCallFake((name) ->
        if name is 'linter'
          return 'some-random-stuff'
        else
          return null
      )
      Helpers = require('../lib/helpers')
      retVal = Helpers.packagesToInstall('wow')
      expect(retVal.toEnable).toEqual(['linter'])
      expect(retVal.toInstall).toEqual(['atom-hack'])

  describe '::install', ->
    it 'works', ->
      spyOn(atom.packages, 'enablePackage').andCallFake(->)
      spyOn(atom.packages, 'activatePackage').andCallFake(->)

      # View spies
      View = require('../lib/view')
      view = {
        show: jasmine.createSpy('view.show')
        advance: jasmine.createSpy('view.advance')
      }
      spyOn(View, 'View').andReturn(view)

      # Install spies
      Helpers = require('../lib/helpers')
      spyOn(Helpers, 'installPackages').andCallFake (dependencies, successCallback) ->
        expect(dependencies).toEqual(['linter', 'linter-ruby'])
        dependencies.forEach (name) ->
          successCallback(name, true)
          atom.packages.activatePackage(name)
        return Promise.resolve()
      spyOn(Helpers, 'packagesToInstall').andReturn({
        toEnable: ['pigments'],
        toInstall: ['linter', 'linter-ruby']
      })

      # Main spies
      PackageDeps = require('../lib/main')

      waitsForPromise ->
        PackageDeps.install('some-package', true).then ->
          expect(atom.packages.enablePackage).toHaveBeenCalled()
          expect(atom.packages.enablePackage.callCount).toBe(1)
          expect(atom.packages.activatePackage).toHaveBeenCalled()
          expect(atom.packages.activatePackage.callCount).toBe(3)
          expect(view.show.callCount).toBe(1)
          expect(view.advance.callCount).toBe(2)
