'use strict'

export class View {
  constructor(name, dependencies) {
    this.name = name
    this.progress = document.createElement('progress')
    this.completed = 0
    this.dependencies = dependencies
    this.notification = atom.notifications.addInfo(`Installing ${name} dependencies`, {
      detail: `Installing ${dependencies.join(', ')}`,
      dismissable: true
    })
    this.notificationView = atom.views.getView(this.notification)

    const content = this.notificationView.querySelector('.detail-content')
    if (content) {
      content.appendChild(this.progress)
    }
    this.progress.max = dependencies.length
    this.progress.style.width = '100%'
  }
  advance() {
    this.completed++
    if (this.completed) {
      this.progress.value = this.completed
    }
  }
  markFinished() {
    const content = this.notificationView.querySelector('.detail-content')
    const title = this.notificationView.querySelector('.message p')

    if (content) {
      content.textContent = `Installed ${this.dependencies.join(', ')}`
    }
    if (title) {
      title.textContent = `Installed ${this.name} dependencies`
    }

    this.notificationView.classList.remove('info')
    this.notificationView.classList.remove('icon-info')
    this.notificationView.classList.add('success')
    this.notificationView.classList.add('icon-check')
  }
  dismiss() {
    this.notification.dismiss()
  }
}
