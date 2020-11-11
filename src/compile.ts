import { CompilerOptions } from './type/options'
import baseParse from './parse'
import { generate } from './codegen'
import { CodegenResult} from './type'
import { transform as internalTransform } from './transform'
import { RootNode} from './parse/ast'
import { transformStatement } from './tranform-plugin/transformStatement'

export function transform(ast: RootNode, options: CompilerOptions){
    internalTransform(ast, {
        nodeTransforms: [transformStatement],
        ...options
    })
    return ast;
}

export default function baseCompile(
    scss: string,
    options: CompilerOptions = {
        filename: 'default.scss',
        source: ''
    }
): CodegenResult {
    let ast = baseParse(scss, options)

    transform(ast, {
        ...options
    })

    return generate(ast, options)
}