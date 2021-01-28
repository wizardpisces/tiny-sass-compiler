import { CompilerOptions } from './type/options'
import baseParse from './parse'
import { generate } from './codegen'
import { CodegenResult } from './type'
import { transform } from './transform'

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