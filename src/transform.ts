import { NodeTypes, Node, RootNode, Statement } from './parse/ast'
import { TransformOptions } from './type'
import { defaultOnError } from './parse/errors'
import {
    Environment
} from './enviroment/Enviroment'
import transformChain, { transform_module as transformModule} from './transform-middleware/index'
import { isBrowser} from './global'
// - NodeTransform:
//   Transforms that operate directly on a childNode. NodeTransforms may mutate,
//   replace or remove the node being processed.
export type NodeTransform = (
    node: Node,
    context: TransformContext
) => Statement

export interface TransformContext extends Required<TransformOptions>{
    root: RootNode
    env: Environment,
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
    }

    return context
}

export function transform(root: RootNode, options: TransformOptions) {
    
    const context = createTransformContext(root, options)

    if (!isBrowser()){
        root = transformModule(root, options)
    }

    traverseRoot(root, context);

    // transformChain will be slowly replaced by transform plugins if possible, where self designed plugin comes up
    transformChain(root)
}

export function traverseRoot(root:RootNode,context:TransformContext){
    const { nodeTransforms } = context

    root.children = root.children.map((child)=>{
        for (let i = 0; i < nodeTransforms.length; i++) {
            child = nodeTransforms[i](child, context)
        }
        return child;
    }).filter((child) => child.type !== NodeTypes.EMPTY)
}