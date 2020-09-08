import { NodeTypes, Node, RootNode, ParentNode, CodegenNode } from './parse/ast'
import { TransformOptions } from './options'
import { defaultOnError } from './parse/errors'
import {
    Environment
} from './parse/util'
import transformChain, { transform_module as transformModule} from './transform-middleware/index'

// - NodeTransform:
//   Transforms that operate directly on a ChildNode. NodeTransforms may mutate,
//   replace or remove the node being processed.
export type NodeTransform = (
    node: Node,
    context: TransformContext
) => void | (() => void) | (() => void)[]

export interface TransformContext extends Required<TransformOptions>{
    root: RootNode
    currentNode: Node | null,
    parent:Node | null,
    childIndex:number,
    env: Environment,
    // removeNode(node?: Node): void
    replaceNode(node?: Node): void
    onNodeRemoved(): void
}

export function createTransformContext(
    root: RootNode,
    {
        nodeTransforms = [],
        onError = defaultOnError,
        sourceDir = './'
    }: TransformOptions
): TransformContext {
    const context: TransformContext = {
        onError,
        nodeTransforms,
        root,
        sourceDir,
        env: new Environment(null),
        parent : null,
        currentNode : root,
        childIndex:0,
        onNodeRemoved:()=>{},
        replaceNode(node: Node) {

            if (!context.parent) {
                throw new Error(`Cannot replace root node.`)
            }

            context.parent!.children[context.childIndex] = context.currentNode = node

            return node;
        }
    }

    return context
}

export function transform(root: RootNode, options: TransformOptions) {
    
    const context = createTransformContext(root, options)

    if(!__BROWSER__){
        root = transformModule(root, options)
    }

    traverseNode(root, context)

    // transformChain will be slowly replaced by transform plugins if possible
    root = transformChain(root)
}

export function traverseChildren(
    parent: ParentNode,
    context: TransformContext
) {
    let i = 0
    const nodeRemoved = () => {
        i--
    }
    for (; i < parent.children.length; i++) {
        const child = parent.children[i]

        context.parent = parent
        context.childIndex = i
        context.onNodeRemoved = nodeRemoved
        
        traverseNode(child, context)
    }

    parent.children = (parent.children as CodegenNode[]).filter((node:CodegenNode) => node.type !== NodeTypes.EMPTY)

}
/*
only traverse top level for now
this sass compiler combined evaluate and compiling to direct target code so it needs to construct executing env while compiling
so it will be difficult for pure transform plugins
different from compile to target code which is evaluatable 
  */
export function traverseNode(
    node: Node,
    context: TransformContext
) {
    context.currentNode = node
    // apply transform plugins
    const { nodeTransforms } = context
    
    if (node.type !== NodeTypes.RootNode){
        for (let i = 0; i < nodeTransforms.length; i++) {
            nodeTransforms[i](node, context)
        }
    }

    if (node.type === NodeTypes.RootNode){
        traverseChildren(node as ParentNode, context)
    }
}