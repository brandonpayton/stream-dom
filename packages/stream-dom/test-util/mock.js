import { sync as syncSubject, hold as holdSubject } from 'most-subject'

import { wait } from './time'

export function scope () {
  return {
    document,
    parentNamespaceUri: `http://www.w3.org/1999/xhtml`,
    sharedRange: document.createRange(),
    mounted$: holdSubject(1, syncSubject()),
    destroy$: holdSubject(1, syncSubject())
  }
}

export function signalMounted (mockScope) {
  return wait().then(() => mockScope.mounted$.next())
}
