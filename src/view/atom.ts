import escapeHtml from 'escape-html'

import { Dependency } from '../types'
import { markPackageAsIgnored } from '../helpers'

let showResetInstruction = true
export function confirmPackagesToInstall({
  packageName,
  dependencies,
}: {
  packageName: string
  dependencies: (Dependency | Dependency[])[]
}): Promise<Dependency[]> {
  return new Promise((resolve) => {
    const ungroupedDependencies = dependencies.filter((item) => !Array.isArray(item)) as Dependency[]
    const groupedDependencies = dependencies.filter((item) => Array.isArray(item)) as Dependency[][]

    const skipGroups = groupedDependencies.length === 0
    const detail = skipGroups
      ? ungroupedDependencies.map((item) => (item.version ? `${item.name}@${item.version}` : item.name)).join(', ')
      : 'Something went wrong. Check your developer console'
    const groupChoices = groupedDependencies.map((item) => item[0])

    const notification = atom.notifications.addInfo(`${packageName} needs to install dependencies`, {
      dismissable: true,
      icon: 'cloud-download',
      detail,
      description: `Install dependenc${dependencies.length === 1 ? 'y' : 'ies'}?`,
      buttons: [
        {
          text: 'Yes',
          onDidClick: () => {
            if (skipGroups) {
              resolve()
            } else {
              resolve(ungroupedDependencies.concat(groupChoices))
            }
            notification!.dismiss()
          },
        },
        {
          text: 'No Thanks',
          onDidClick: () => {
            notification!.dismiss()
          },
        },
        {
          text: 'Never',
          onDidClick: () => {
            markPackageAsIgnored(packageName)

            if (showResetInstruction) {
              showResetInstruction = false
              atom.notifications.addInfo('How to reset package-deps memory', {
                dismissable: true,
                description:
                  "To modify the list of ignored files invoke 'Application: Open Your Config' and change the 'atom-package-deps' section",
              })
            }
            notification!.dismiss()
          },
        },
      ],
    })
    notification.onDidDismiss(() => resolve([]))
    if (skipGroups) {
      return
    }

    // Handle groups
    try {
      const notificationView = atom.views.getView(notification) as { element?: HTMLElement } | null
      const notificationElement = notificationView?.element ?? null
      if (notificationElement == null) {
        throw new Error('Unable to get notification element from view')
      }
      const notificationContent = notificationElement.querySelector('.detail-content')
      if (notificationContent == null) {
        throw new Error('Content detail container not found inside the notification')
      }
      // Clear the contents and add some skel
      notificationContent.innerHTML = ''

      // Add list of ungroup dependencies to the top of the notification
      if (ungroupedDependencies.length > 0) {
        const ungroupedLine = document.createElement('div')
        ungroupedLine.classList.add('line')
        ungroupedLine.innerHTML = `Packages without choices: <br />- ${ungroupedDependencies
          .map((item) => escapeHtml(item.version ? `${item.name}@${item.version}` : item.name))
          .join('<br />- ')}`
        notificationContent.appendChild(ungroupedLine)
      }

      // Create a label line for groups
      const groupLabelLine = document.createElement('div')
      groupLabelLine.classList.add('line')
      groupLabelLine.innerHTML = `Packages with choices: <br />`
      notificationContent.appendChild(groupLabelLine)

      // Create one line per group with a select inside
      groupedDependencies.forEach((item, index) => {
        const line = document.createElement('div')
        const select = document.createElement('select')
        select.innerHTML = item.map((subitem) => `<option>${escapeHtml(subitem.name)}</option>`).join('\n')
        select.addEventListener('change', () => {
          // Change the selected value for this index for resolve to use
          const subitem = item.find((subitem) => subitem.name === select.value)
          if (subitem != null) {
            groupChoices[index] = subitem
          }
        })
        line.classList.add('line')
        line.appendChild(select)
        notificationContent.appendChild(line)
      })
    } catch (err) {
      console.error('[Package-Deps] Error during showing package choices to user', err)
    }
  })
}

export default function getView({ packageName, dependencies }: { packageName: string; dependencies: Dependency[] }) {
  return {
    handleFailure(error: Error): void {},
    handleDependencyInstalled(dependencyName: string): void {},
  }
}
