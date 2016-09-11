import { StreamDomScope } from '../index'

import { Stream } from 'most'

export type DomContainerNode = HTMLElement | DocumentFragment

export interface NodeDescriptor {
  type: string
  insert(domParentNode: DomContainerNode, domBeforeNode?: Node): void
  remove(): void
}

export interface InitializeNode {
  (scope: StreamDomScope): NodeDescriptor
}

// TODO: Strengthen this name
export type ChildDeclaration = InitializeNode | InitializeNode[]

export interface Attribute {
  namespace?: string
  name: string
  value: Stream<any> | any
}

export type Attributes = Array<Attribute | Attribute[]>
