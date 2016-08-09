/* @flow */
/* eslint-disable global-require */

import Path from 'path'
import { wait } from 'jasmine-fix'
import { it } from './helpers'

describe('Main Module', function() {
  function uninstallPackage(name) {
    return atom.packages.uninstallDirectory(
      Path.join(atom.packages.getPackageDirPaths().pop(), name)
    )
  }

  it('works as a whole', async function() {
    const _ = atom.packages.getLoadedPackage
    const packageName = 'auto-semicolon'
    spyOn(atom.packages, 'getLoadedPackage').andCallFake(function(name) {
      if (name === 'some-package') {
        return {
          metadata: {
            main: 'index.js',
            'package-deps': [packageName],
          },
        }
      }
      return _.call(this, name)
    })

    expect(atom.packages.getActivePackage(packageName)).not.toBeDefined()
    await require('./fixtures/packages/some-package').activate()
    expect(atom.packages.getActivePackage(packageName)).toBeDefined()
    await uninstallPackage(packageName)

    const notifications = atom.notifications.getNotifications()
    expect(notifications.length).toBe(2)
    expect(notifications[0].type).toBe('info')
  })

  it('handles errors pretty good', async function() {
    const _ = atom.packages.getLoadedPackage
    spyOn(atom.packages, 'getLoadedPackage').andCallFake(function(name) {
      if (name === 'some-package') {
        return {
          metadata: {
            main: 'index.js',
            'package-deps': ['non-existent-package'],
          },
        }
      }
      return _.call(this, name)
    })

    await require('./fixtures/packages/some-package').activate()
    await wait(50)

    const notifications = atom.notifications.getNotifications()
    expect(notifications.length).toBe(2)
    expect(notifications[1].type).toBe('warning')
  })

  it('can install multiple packages at once', async function() {
    const _ = atom.packages.getLoadedPackage
    const packageNameFirst = 'atom-idle-autosave'
    const packageNameSecond = 'glow'
    spyOn(atom.packages, 'getLoadedPackage').andCallFake(function(name) {
      if (name === 'some-package') {
        return {
          metadata: {
            main: 'index.js',
            'package-deps': [packageNameFirst, packageNameSecond, 'tree-view'],
          },
        }
      }
      return _.call(this, name)
    })

    expect(atom.packages.getActivePackage(packageNameFirst)).not.toBeDefined()
    expect(atom.packages.getActivePackage(packageNameSecond)).not.toBeDefined()
    await require('./fixtures/packages/some-package').activate()
    expect(atom.packages.getActivePackage(packageNameFirst)).toBeDefined()
    expect(atom.packages.getActivePackage(packageNameSecond)).toBeDefined()
    await uninstallPackage(packageNameFirst)
    await uninstallPackage(packageNameSecond)

    const notifications = atom.notifications.getNotifications()
    expect(notifications.length).toBe(2)
    expect(notifications[0].type).toBe('info')
  })

  it('works with hardcoded package names', async function() {
    const _ = atom.packages.getLoadedPackage
    const packageName = 'atom-bracket-highlight'
    spyOn(atom.packages, 'getLoadedPackage').andCallFake(function(name) {
      if (name === 'some-package') {
        return {
          metadata: {
            main: 'index.js',
            'package-deps': [packageName],
          },
        }
      }
      return _.call(this, name)
    })

    expect(atom.packages.getActivePackage(packageName)).not.toBeDefined()
    await require('./fixtures/packages/some-package/index-hardcoded-name').activate()
    expect(atom.packages.getActivePackage(packageName)).toBeDefined()
    await uninstallPackage(packageName)

    const notifications = atom.notifications.getNotifications()
    expect(notifications.length).toBe(2)
    expect(notifications[0].type).toBe('info')
  })

  it('stays silent when that package name is not found in active packages', async function() {
    await require('./fixtures/packages/some-package/index-hardcoded-name').activate()
    const notifications = atom.notifications.getNotifications()
    expect(notifications.length).toBe(0)
  })
})
