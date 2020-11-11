import { NodeTransform} from '../transform'
import { CompilerError} from '../parse/errors'

export interface TransformOptions {
    /**
     * An array of node trasnforms to be applied to every AST node.
     */
    nodeTransforms?: NodeTransform[]

    // resolve @import
    sourceDir?: string

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