/* @flow */

import invariant from 'assert'
import path from 'path'
import { getDependencies } from './check'

if (typeof global.__steelbrain_package_deps === 'undefined') {
  global.__steelbrain_package_deps = new Set()
}

async function installDependencies(packageName: string, shouldPromptUser: boolean = true): Promise<void> {
  invariant(packageName, '[Package-Deps] Package name is required')

  const dependencies = await getDependencies(packageName)
  if (!dependencies.length) {
    return
  }

  // Prompt user
  if (shouldPromptUser) {
    let choice: 'Yes' | 'No' | 'Never' = 'Yes'
    await import('./prompt').then(async ({ promptUser }) => {
      choice = await promptUser(packageName, dependencies)
    })

    if (choice !== 'Yes') {
      return
    }
  }

  await import('./install').then(async ({ performInstall }) =>
    // Perform Installation
    performInstall(packageName, dependencies),
  )
}


function installByPath(packagePath: string): void {
  let packageJSONPath = packagePath
  if (!packagePath.endsWith('package.json')){
    packageJSONPath = path.join(packagePath, 'package.json')
  }
  import('./install-by-path').then( ({ getDependenciesByPath, apmInstallByPath }) => {
    const dependencies = getDependenciesByPath(packageJSONPath)
    apmInstallByPath(dependencies)
  })
}

export { installDependencies as install, installByPath}

// dynamic import doc: https://rollupjs.org/guide/en/#dynamic-import
