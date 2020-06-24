import { NodeTransform} from './transform'

export interface TransformOptions {
    /**
     * An array of node trasnforms to be applied to every AST node.
     */
    nodeTransforms?: NodeTransform[]
}

export interface CodegenOptions {
    /**
     * Generate source map?
     * @default false
     */
    sourceMap?: boolean
}