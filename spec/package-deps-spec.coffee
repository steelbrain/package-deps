describe 'Package-Deps', ->

  PackageDeps = require('../lib/main')

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
      retVal = PackageDeps.packagesToInstall('wow')
      expect(retVal.toEnable).toEqual(['linter'])
      expect(retVal.toInstall).toEqual(['atom-hack'])

