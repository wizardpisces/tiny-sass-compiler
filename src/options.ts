import { NodeTransform} from './transform'
import { CompilerError} from './parse/errors'
import {Environment} from './parse/util'
export interface TransformOptions {
    /**
     * An array of node trasnforms to be applied to every AST node.
     */
    nodeTransforms?: NodeTransform[]

    // resolve @import
    sourceDir?: string
    
    // scope chain dynamically evaluate variables / function / expressions when transform ast
    env: Environment

    onError?: (error: CompilerError) => void
}

export interface CodegenOptions {
    /**
     * Generate source map?
     * @default false
     */
    sourceMap?: boolean
}

export interface ParserOptions {

}

export type CompilerOptions = ParserOptions & TransformOptions & CodegenOptions