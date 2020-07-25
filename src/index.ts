import invariant from 'assert'
import { getDependencies } from './check'

if (typeof window.__steelbrain_package_deps === 'undefined') {
  window.__steelbrain_package_deps = new Set()
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

export { installDependencies as install }

// dynamic import doc: https://rollupjs.org/guide/en/#dynamic-import
