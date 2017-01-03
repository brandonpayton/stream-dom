export type TagDeclaration = {
  name: string,
  classes?: string[]
  id?: string
}

// TODO: Create a real parser
export function parseTagExpression (str): TagDeclaration {
  const hashIndex = str.indexOf('#')

  const id = hashIndex >= 0 ? str.slice(hashIndex + 1) : ''
  const [ name, ...classes ] = str.slice(0, hashIndex === -1 ? str.length : hashIndex).split('.')

  if (name.length === 0) {
    throw new Error('Tag name may not be zero-length')
  }

  const result: TagDeclaration = { name }
  id && (result.id = id)
  classes.length > 0 && (result.classes = classes)
  return result
}

