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
        ungroupedLine.innerHTML = `Packages without choices: <br /><ul><li>${ungroupedDependencies
          .map((item) => escapeHtml(item.version ? `${item.name}@${item.version}` : item.name))
          .join('</li><li>')}</li></ul>`
        notificationContent.appendChild(ungroupedLine)
      }

      // Create a label line for groups
      const groupLabelLine = document.createElement('div')
      groupLabelLine.innerHTML = `Packages with choices:`
      notificationContent.appendChild(groupLabelLine)

      // Create one line per group with a select inside
      const groupedList = document.createElement('ul')
      groupedDependencies.forEach((item, index) => {
        const listItem = document.createElement('li')
        const select = document.createElement('select')
        select.innerHTML = item.map((subitem) => `<option>${escapeHtml(subitem.name)}</option>`).join('\n')
        select.addEventListener('change', () => {
          // Change the selected value for this index for resolve to use
          const subitem = item.find((subitem) => subitem.name === select.value)
          if (subitem != null) {
            groupChoices[index] = subitem
          }
        })
        listItem.style.marginTop = '5px'
        listItem.appendChild(select)
        groupedList.appendChild(listItem)
      })
      notificationContent.appendChild(groupedList)
    } catch (err) {
      console.error('[Package-Deps] Error during showing package choices to user', err)
    }
  })
}

export function getView({ packageName, dependencies }: { packageName: string; dependencies: Dependency[] }) {
  const failed: string[] = []
  const notification = atom.notifications.addInfo(`Installing ${packageName} dependencies`, {
    detail: `Installing ${dependencies.map((item) => item.name).join(', ')}`,
    dismissable: true,
  })
  const progress = document.createElement('progress')

  progress.max = dependencies.length
  progress.style.width = '100%'

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
    notificationContent.appendChild(progress)
  } catch (err) {
    console.error('[Package-Deps] Error during showing installation progress to user', err)
  }

  return {
    handleFailure({ dependency, error }: { dependency: Dependency; error: Error }): void {
      failed.push(dependency.name)

      console.error(`[Package-Deps] Unable to install ${dependency.name}, Error:`, error?.stack ?? error)
    },
    handleDependencyInstalled(dependency: Dependency): void {
      progress.value += 1
    },
    handleComplete() {
      notification.dismiss()
      if (failed.length > 0) {
        atom.notifications.addWarning(`Failed to install ${packageName} dependencies`, {
          detail: `These packages were not installed, check your console\nfor more info.\n${failed.join('\n')}`,
          dismissable: true,
        })
      } else {
        atom.notifications.addSuccess(`Installed ${packageName} dependencies`, {
          detail: `Installed ${dependencies.map((item) => item.name).join(', ')}`,
        })
      }

      Promise.all(
        dependencies.map((item) => {
          if (!failed.includes(item.name)) {
            return atom.packages.activatePackage(item.name)
          }
        }),
      ).catch((err) => {
        console.error(`[Package-Deps] Error activating installed packages for ${packageName}`, err)
      })
    },
  }
}
