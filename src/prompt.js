/* @flow */

import Path from 'path'
import fs from 'sb-fs'
import type { Dependency } from './types'

let shownStorageInfo = false

export async function promptUser(packageName: string, dependencies: Array<Dependency>): Promise<'Yes' | 'No' | 'Never'> {
  const oldConfigPath = Path.join(atom.getConfigDirPath(), 'package-deps-state.json')
  let ignoredPackages = atom.config.get('atom-package-deps.ignored') || []

  if (await fs.exists(oldConfigPath)) {
    const oldConfig = JSON.parse(await fs.readFile(oldConfigPath, 'utf8'))
    atom.config.set('atom-package-deps.ignored', (ignoredPackages = oldConfig.ignored))
    await fs.unlink(oldConfigPath)
  }

  if (ignoredPackages.includes(packageName)) {
    return 'No'
  }

  if (atom.packages.isPackageDisabled('notifications')) {
    console.warn(`Enable notifications to install dependencies for ${packageName}`)
  }

  return new Promise(function (resolve) {
    const notification = atom.notifications.addInfo(`${packageName} needs to install dependencies`, {
      dismissable: true,
      icon: 'cloud-download',
      detail: dependencies.map((e) => e.name).join(', '),
      description: `Install dependenc${dependencies.length === 1 ? 'y' : 'ies'}?`,
      buttons: [
        {
          text: 'Yes',
          onDidClick: () => {
            resolve('Yes')
            notification.dismiss()
          },
        },
        {
          text: 'No Thanks',
          onDidClick: () => {
            resolve('No')
            notification.dismiss()
          },
        },
        {
          text: 'Never',
          onDidClick: () => {
            // Reload, in case it may have changed:
            ignoredPackages = atom.config.get('atom-package-deps.ignored') || []
            ignoredPackages.push(packageName)
            atom.config.set('atom-package-deps.ignored', ignoredPackages)

            if (!shownStorageInfo) {
              shownStorageInfo = true
              atom.notifications.addInfo('How to reset package-deps memory', {
                dismissable: true,
                description:
                  "To modify the list of ignored files invoke 'Application: Open Your Config' and change the 'atom-package-deps' section",
              })
            }
            resolve('Never')
            notification.dismiss()
          },
        },
      ],
    })
    notification.onDidDismiss(() => resolve('No'))
  })
}
