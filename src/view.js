/* @flow */

import type { Dependency } from './types'

export default class View {
  name: string;
  advance: (() => void);
  dispose: (() => void);
  dependencies: Array<Dependency>;

  constructor(name: string, dependencies: Array<Dependency>) {
    this.name = name
    this.dependencies = dependencies

    const notification = atom.notifications.addInfo(`Installing ${name} dependencies`, {
      detail: `Installing ${dependencies.map(View.getDependencyName).join(', ')}`,
      dismissable: true,
    })
    const progress: Object = document.createElement('progress')
    this.dispose = function() {
      notification.dismiss()
    }
    this.advance = function() {
      progress.value++
    }
    progress.max = dependencies.length
    progress.style.width = '100%'
    try {
      const notificationView = atom.views.getView(notification)
      const notificationContent = notificationView.querySelector('.detail-content')
      if (notificationContent) {
        notificationContent.appendChild(progress)
      }
    } catch (_) { /* Notifications package is disabled */ }
  }
  complete(errors: Map<string, Error>): void {
    this.dispose()
    if (!errors.size) {
      atom.notifications.addSuccess(`Installed ${this.name} dependencies`, {
        detail: `Installed ${this.dependencies.map(View.getDependencyName).join(', ')}`,
      })
      return
    }
    const packages = []
    for (const [packageName, error] of errors) {
      packages.push(`  • ${packageName}`)
      console.error(`[Package-Deps] Unable to install ${packageName}, Error:`, ((error && error.stack) || error))
    }
    atom.notifications.addWarning(`Failed to install ${this.name} dependencies`, {
      detail: `These packages were not installed, check your console\nfor more info.\n${packages.join('\n')}`,
      dismissable: true,
    })
  }
  static getDependencyName(dependency: Dependency): string {
    return `${dependency.name}${dependency.version ? ` v${dependency.version}` : ''}`
  }
}
