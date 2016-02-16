'use strict'

export class Installer {
  constructor(packages) {
    this.packages = packages
  }
  async install() {
    console.log('installer', this.packages)
  }
}
