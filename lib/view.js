'use babel'
export class View {
  constructor(name, dependencies) {
    this.name = name
    this.dependencies = dependencies

    const progress = this.progress = document.createElement('progress')
    progress.max = dependencies.length
    progress.value = 0
    progress.classList.add('display-inline')
    progress.style.width = '100%'

    this.notification = this.element = null
  }
  show() {
    this.notification = atom.notifications.addInfo(`Installing ${this.name} dependencies`, {
      detail: `Installing ${this.dependencies.join(', ')}`,
      dismissable: true
    })
    this.element = document.createElement('div') // placeholder
    setTimeout(() => {
      try {
        this.element = atom.views.getView(this.notification)

        const content = this.element.querySelector('.detail-content')
        if (content) {
          content.appendChild(this.progress)
        }
      } catch (_) { }
    }, 20)
  }
  advance() {
    this.progress.value++
    if (this.progress.value === this.progress.max) {
      const content = this.element.querySelector('.detail-content')
      const title = this.element.querySelector('.message p')

      if (content) {
        content.textContent = `Installed ${this.dependencies.join(', ')}`
      }
      if (title) {
        title.textContent = `Installed ${this.name} dependencies`
      }

      this.element.classList.remove('info')
      this.element.classList.remove('icon-info')
      this.element.classList.add('success')
      this.element.classList.add('icon-check')
    }
  }
}
