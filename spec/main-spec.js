'use babel'

import Path from 'path'
import {it} from './helpers'

describe('Main Module', function() {
  afterEach(function() {
    waitsForPromise(function() {
      return atom.packages.uninstallDirectory(Path.join(atom.packages.getPackageDirPaths().pop(), 'auto-semicolon'))
    })
  })

  it('works as a whole', async function() {
    const _ = atom.packages.getLoadedPackage
    const packageName = 'auto-semicolon'
    spyOn(atom.packages, 'getLoadedPackage').andCallFake(function(name) {
      if (name === 'some-package') {
        return {
          metadata: {
            'main': 'index.js',
            'package-deps': [packageName]
          }
        }
      } else return _.call(this, name)
    })

    expect(atom.packages.getActivePackage(packageName)).not.toBeDefined()
    await require('./fixtures/packages/some-package').activate()
    expect(atom.packages.getActivePackage(packageName)).toBeDefined()
  })
})
