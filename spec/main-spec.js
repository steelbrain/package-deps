'use babel'

import Path from 'path'
import {it, wait} from './helpers'

describe('Main Module', function() {
  afterEach(function() {
    waitsForPromise(function() {
      return atom.packages.uninstallDirectory(Path.join(atom.packages.getPackageDirPaths().pop(), 'auto-semicolon'))
    })
  })

  it('works as a whole', async function() {
    return
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

    const notifications = atom.notifications.getNotifications()
    expect(notifications.length).toBe(1)
    expect(notifications[0].type).toBe('info')
  })

  it('handles errors pretty good', async function() {
    const _ = atom.packages.getLoadedPackage
    spyOn(atom.packages, 'getLoadedPackage').andCallFake(function(name) {
      if (name === 'some-package') {
        return {
          metadata: {
            'main': 'index.js',
            'package-deps': ['non-existent-package']
          }
        }
      } else return _.call(this, name)
    })

    await require('./fixtures/packages/some-package').activate()
    await wait(50)

    const notifications = atom.notifications.getNotifications()
    expect(notifications.length).toBe(2)
    expect(notifications[1].type).toBe('error')
  })
})
