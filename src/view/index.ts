import { IS_ATOM } from '../constants'
import { getView as getViewAtom, confirmPackagesToInstall as confirmPackagesToInstallAtom } from './pulsar'
import { getView as getViewNode, confirmPackagesToInstall as confirmPackagesToInstallNode } from './node'

export const getView = IS_ATOM ? getViewAtom : getViewNode
export const confirmPackagesToInstall = IS_ATOM ? confirmPackagesToInstallAtom : confirmPackagesToInstallNode
