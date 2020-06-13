/* @flow */

export type Dependency = {
  url: ?string,
  name: string,
}

export type DependencyByPath = {
  url: ?string,
  name: string,
  version: ?string,
}
