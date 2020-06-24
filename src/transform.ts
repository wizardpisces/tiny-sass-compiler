import { Node, RootNode } from './parse/ast'
import { TransformOptions } from './options'

// - NodeTransform:
//   Transforms that operate directly on a ChildNode. NodeTransforms may mutate,
//   replace or remove the node being processed.
export type NodeTransform = (
    node: Node,
    context: TransformContext
) => void | (() => void) | (() => void)[]

export interface TransformContext extends Required<TransformOptions>{
    root: RootNode
}

// export function createTransformContext(
//     root: RootNode,
//     {
//         nodeTransforms = [],
//         // onError = defaultOnError
//     }: TransformOptions
// ): TransformContext {
//     const context: TransformContext = {
//         // options
//         nodeTransforms,
//         // state
//         root
//     }

//     return context
// }

// export function transform(root: RootNode, options: TransformOptions) {
//     const context = createTransformContext(root, options)
//     traverseNode(root, context)
// }


// export function traverseNode(
//     node: Node,
//     context: TransformContext
// ) {
//     // context.currentNode = node
//     // apply transform plugins
//     const { nodeTransforms } = context
//     const exitFns = []
//     for (let i = 0; i < nodeTransforms.length; i++) {
//         const onExit = nodeTransforms[i](node, context)
//         // if (onExit) {
//         //     if (isArray(onExit)) {
//         //         exitFns.push(...onExit)
//         //     } else {
//         //         exitFns.push(onExit)
//         //     }
//         // }
//         // if (!context.currentNode) {
//         //     // node was removed
//         //     return
//         // } else {
//         //     // node may have been replaced
//         //     node = context.currentNode
//         // }
//     }

//     // switch (node.type) {
//     //     case NodeTypes.COMMENT:
//     //         if (!context.ssr) {
//     //             // inject import for the Comment symbol, which is needed for creating
//     //             // comment nodes with `createVNode`
//     //             context.helper(CREATE_COMMENT)
//     //         }
//     //         break
//     //     case NodeTypes.INTERPOLATION:
//     //         // no need to traverse, but we need to inject toString helper
//     //         if (!context.ssr) {
//     //             context.helper(TO_DISPLAY_STRING)
//     //         }
//     //         break

//     //     // for container types, further traverse downwards
//     //     case NodeTypes.IF:
//     //         for (let i = 0; i < node.branches.length; i++) {
//     //             traverseNode(node.branches[i], context)
//     //         }
//     //         break
//     //     case NodeTypes.IF_BRANCH:
//     //     case NodeTypes.FOR:
//     //     case NodeTypes.ELEMENT:
//     //     case NodeTypes.ROOT:
//     //         traverseChildren(node, context)
//     //         break
//     // }

//     // exit transforms
//     let i = exitFns.length
//     while (i--) {
//         exitFns[i]()
//     }
// }