import { NodeTypes, Node, RootNode, ParentNode } from './parse/ast'
import { TransformOptions } from './options'
import { defaultOnError } from './parse/errors'
import {isArray} from './parse/util'
// - NodeTransform:
//   Transforms that operate directly on a ChildNode. NodeTransforms may mutate,
//   replace or remove the node being processed.
export type NodeTransform = (
    node: Node,
    context: TransformContext
) => void | (() => void) | (() => void)[]

export interface TransformContext extends Required<TransformOptions>{
    root: RootNode
    currentNode: Node
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
        currentNode : root
    }

    return context
}

export function transform(root: RootNode, options: TransformOptions) {
    const context = createTransformContext(root, options)
    traverseNode(root, context)
}

export function traverseChildren(
    parent: ParentNode,
    context: TransformContext
) {
    let i = 0
    // const nodeRemoved = () => {
    //     i--
    // }
    for (; i < parent.children.length; i++) {
        const child = parent.children[i]

        // context.parent = parent
        // context.childIndex = i
        // context.onNodeRemoved = nodeRemoved
        
        traverseNode(child, context)
    }
}


export function traverseNode(
    node: Node,
    context: TransformContext
) {
    context.currentNode = node
    // apply transform plugins
    const { nodeTransforms } = context
    const exitFns = []
    for (let i = 0; i < nodeTransforms.length; i++) {
        const onExit = nodeTransforms[i](node, context)
        if (onExit) {
            if (isArray(onExit)) {
                exitFns.push(...onExit)
            } else {
                exitFns.push(onExit)
            }
        }
        if (!context.currentNode) {
            // node was removed
            return
        } else {
            // node may have been replaced
            node = context.currentNode
        }
    }

    switch (node.type) {
        // for container types, further traverse downwards
        // case NodeTypes.PROGRAM:
        //     for (let i = 0; i < node.children.length; i++) {
        //         traverseNode(node.children[i], context)
        //     }
        //     break
        case NodeTypes.MIXIN:
        case NodeTypes.EACHSTATEMENT:
            traverseNode(node.body,context);

        case NodeTypes.IFSTATEMENT:
            traverseNode(node.consequent,context)
            traverseNode(node.alternate,context)

        case NodeTypes.BODY:
        case NodeTypes.CHILD:
        case NodeTypes.PROGRAM:
            traverseChildren(node as ParentNode, context)
            break
    }

    // exit transforms
    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}