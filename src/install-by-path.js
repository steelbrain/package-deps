import {exec} from 'shelljs'
import fs from 'fs'
import type { DependencyByPath } from './types'

const DEPENDENCY_REGEX_VERSION = /(.*?):.*/ // linter:2.0.0
const DEPENDENCY_REGEX_GIRURL = /(.*?)#.*/ // linter#steelbrain/linter

function getDepData(packageDependencies: Array<string>) {
  packageDependencies.map(function(entry) {
    let url = null
    let name = entry
    let version = null

    const matchVersion = DEPENDENCY_REGEX_VERSION.exec(entry)
    const matchGiturl = DEPENDENCY_REGEX_GIRURL.exec(entry)
    if (matchVersion) {
      ;[, name, version] = matchVersion
    } else if (matchGiturl) {
      ;[, name, url] = matchGiturl
    } else {
      name = entry
    }

    return { name, url, version }
  })
  return packageDependencies
}

export function getDependenciesByPath(packageJSONPath: string): Array<DependencyByPath> {
  const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath))
  const packageDeps = packageJSON['package-deps']
  if (!packageDeps) {return []}
  const packageDependencies = Array.from(packageDeps)
  return getDepData(packageDependencies)
}

export function apmInstallByPath(dependencies: Array<DependencyByPath>) {

  dependencies.forEach( (dep) => {
    if (dep.url) {
      exec(`apm install ${dep.url}`)
    } else if (dep.version) {
      exec(`apm install ${dep.name}@${dep.version}`)
    } else {
      exec(`apm install ${dep}`)
    }
  })

}
