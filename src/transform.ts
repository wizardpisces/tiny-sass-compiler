import { RootNode } from './parse/ast'
import { TransformOptions, TransformContext } from './type'
import { defaultOnError } from './parse/errors'
import {
    Environment
} from './enviroment/Enviroment'
import { transformMiddleware } from './transform-middleware/index'
import { isBrowser } from './global'
import { compatibleLoadModule } from './css-module'
import { interpret } from './css-module/use/loader'
import { transformStatement } from './interpret'
// - NodeTransform:
//   Transforms that operate directly on a childNode. NodeTransforms may mutate,
//   replace or remove the node being processed.

export function createTransformContext(
    root: RootNode,
    {
        nodeTransforms = [transformStatement],
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
        /**
         * resolve module
         * @use ,@import
         * load-module <--- depend on ----> interpret-module
         */
        compatibleLoadModule(root, context)
    } else {
        interpret(root, context)
    }

    // transformMiddleware will be slowly replaced by transform plugins if possible, where self designed plugin comes up
    transformMiddleware(root)
}
