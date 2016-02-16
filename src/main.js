'use strict'

import {View} from './view'
import {spawnAPM} from './helpers'

export class Installer {
  constructor(name, packages) {
    this.name = name
    this.packages = packages
  }
  async install() {
    const view = new View(this.name, this.packages)
    try {
      await spawnAPM(this.packages, function() {
        view.advance()
      })
    } catch (error) {
      view.dismiss()
      atom.notifications.addError(`Error installing ${this.name} dependencies`, {
        detail: error.stack,
        dismissable: true
      })
    } finally {
      await Promise.all(this.packages.map(name => atom.packages.activatePackage(name)))
    }
  }
}
