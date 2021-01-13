import { RootNode } from './parse/ast'
import { TransformOptions, TransformContext } from './type'
import { defaultOnError } from './parse/errors'
import {
    Environment
} from './enviroment/Enviroment'
import { transformMiddleware } from './transform-middleware/index'
import { isBrowser } from './global'
import { isEmptyNode } from './parse/util'
import { loadImportModuleByAst } from './css-module/module'
// - NodeTransform:
//   Transforms that operate directly on a childNode. NodeTransforms may mutate,
//   replace or remove the node being processed.

export function createTransformContext(
    root: RootNode,
    {
        nodeTransforms = [],
        onError = defaultOnError,
        filename = './default.scss'
    }: TransformOptions
): TransformContext {
    const context: TransformContext = {
        onError,
        nodeTransforms,
        root,
        filename,
        env: new Environment(null),
    }

    return context
}

export function transform(root: RootNode, options: TransformOptions) {

    const context = createTransformContext(root, options)

    if (!isBrowser()) {
        loadImportModuleByAst(root, context)
        // transformUseModule(root, context)
    }

    transformRoot(root, context);

    // transformMiddleware will be slowly replaced by transform plugins if possible, where self designed plugin comes up
    transformMiddleware(root)
}

export function transformRoot(root: RootNode, context: TransformContext) {
    const { nodeTransforms } = context

    root.children = root.children.map((child) => {
        for (let i = 0; i < nodeTransforms.length; i++) {
            child = nodeTransforms[i](child, context)
        }
        return child;
    }).filter((child) => !isEmptyNode(child))
}