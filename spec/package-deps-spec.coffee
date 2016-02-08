describe 'Package-Deps', ->

  window.__steelbrain_package_deps = new Set()

  describe 'packagesToInstall', ->
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

  describe 'view', ->
    it 'works', ->
      advanceClock(1000)
      {View} = require('../lib/view')
      view = new View('some-package', ['linter', 'linter-jshint'])
      view.element = document.createElement('div') # Jasmine and it's spies suck sometimes
      expect(view.progress.value).toBe(0)
      expect(view.progress.max).toBe(2)
      view.advance()
      expect(view.progress.value).toBe(1)
      view.advance()
      expect(view.progress.value).toBe(2)

    it 'works without notifications', ->
      {View} = require('../lib/view')
      view = new View('some-package', ['linter'])
      view.show()
      advanceClock(50)
      expect(view.element).not.toBe(null)
      expect(view.element.tagName).toBe('DIV')

    it 'works with notifications', ->
      {View} = require('../lib/view')
      view = new View('some-package', ['linter'])

      waitsForPromise ->
        atom.packages.activatePackage('notifications').then ->
          view.show()
          advanceClock(50)
          expect(view.element.tagName).not.toBe('div')

  describe 'install', ->
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

      # Main
      PackageDeps = require('../lib/main')

      waitsForPromise ->
        PackageDeps.install('some-package', true).then ->
          expect(atom.packages.enablePackage).toHaveBeenCalled()
          expect(atom.packages.enablePackage.callCount).toBe(1)
          expect(atom.packages.activatePackage).toHaveBeenCalled()
          expect(atom.packages.activatePackage.callCount).toBe(3)
          expect(view.show.callCount).toBe(1)
          expect(view.advance.callCount).toBe(2)
