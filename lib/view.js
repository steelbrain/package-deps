'use babel'
export default class PackageDepsView {
  constructor(packageName, packageNames){
    this.packageName = packageName
    this.packageNames = packageNames
    this.notification = atom.notifications.addInfo(`Installing ${packageName} dependencies`, {
      detail: 'Installing dependencies',
      dismissable: true
    })
    this.notificationElement = atom.views.getView(this.notification)
  }
  markFinished(name) {
    console.log('mark ' + name + ' as finished')
  }
  markErrored(name) {
    console.log('mark ' + name + ' as errored')
  }
}
