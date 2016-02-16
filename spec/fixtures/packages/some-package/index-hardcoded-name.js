'use babel'

module.exports = {
  activate() {
    return require('../../../../').install('some-package')
  }
}
