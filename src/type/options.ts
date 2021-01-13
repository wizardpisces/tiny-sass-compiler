import { CompilerError} from '../parse/errors'
import { RootNode, Statement, CodegenNode } from '../parse/ast'
import { Environment } from '../enviroment/Enviroment'

export interface TransformContext extends Required<TransformOptions> {
    root: RootNode
    env: Environment,
}

export type NodeTransform = (
    node: Statement | CodegenNode,
    context: TransformContext
) => Statement


export interface TransformOptions {
    /**
     * An array of node trasnforms to be applied to every AST node.
     */
    nodeTransforms?: NodeTransform[]

    // mainly used to resolve @import,@use module
    filename?: string

    onError?: (error: CompilerError) => void
}

export interface CodegenOptions {
    /**
     * Generate source map?
     * @default false
     */
    sourceMap?: boolean

    /**
   * Filename for source map generation.
   */
    // filename: string
}

export interface ParserOptions {
    /**
    * Filename for source map generation.
    */
    filename: string
    source: string
}

export type CompilerOptions = ParserOptions & TransformOptions & CodegenOptions