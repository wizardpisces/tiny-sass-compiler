import { NodeTypes, Node, RootNode, ParentNode } from './parse/ast'
import { TransformOptions } from './options'
import { defaultOnError } from './parse/errors'
import { isArray, Environment, createEmptyNode} from './parse/util'
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
    removeNode(node?: Node): void
    replaceNode(node?: Node): void
    onNodeRemoved(): void
}

export function createTransformContext(
    root: RootNode,
    {
        nodeTransforms = [],
        onError = defaultOnError,
        env = new Environment(null),
        sourceDir = './'
    }: TransformOptions
): TransformContext {
    const context: TransformContext = {
        onError,
        nodeTransforms,
        root,
        sourceDir,
        env,
        parent : null,
        currentNode : root,
        childIndex:0,
        onNodeRemoved:()=>{},
        removeNode(node:Node) {
            return context.replaceNode(createEmptyNode())
            // if (!context.parent) {
            //     throw new Error(`Cannot remove root node.`)
            // }
            // const list = context.parent!.children
            // const removalIndex = node
            //     ? list.indexOf(node)
            //     : context.currentNode
            //         ? context.childIndex
            //         : -1
            // /* istanbul ignore if */
            // if (removalIndex < 0) {
            //     throw new Error(`node being removed is not a child of current parent`)
            // }
            // if (!node || node === context.currentNode) {
            //     // current node removed
            //     context.currentNode = null
            //     context.onNodeRemoved()
            // } else {
            //     // sibling node removed
            //     if (context.childIndex > removalIndex) {
            //         context.childIndex--
            //         context.onNodeRemoved()
            //     }
            // }
            // context.parent!.children.splice(removalIndex, 1)

        },
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
    traverseNode(root, context)
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
}

// only traverse top level
export function traverseNode(
    node: Node,
    context: TransformContext
) {
    context.currentNode = node
    // apply transform plugins
    const { nodeTransforms } = context
    const exitFns:Function[] = []
    if (node.type !== NodeTypes.PROGRAM){
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
    }

    switch (node.type) {
        case NodeTypes.PROGRAM:
            traverseChildren(node as ParentNode, context)
            break
    }

    // exit transforms
    // let i = exitFns.length
    // while (i--) {
    //     exitFns[i]()
    // }
}