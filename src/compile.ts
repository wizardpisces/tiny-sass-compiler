import { CompilerOptions } from './options'
import baseParse from './parse'
import { generate } from './codegen'
import { transform } from './transform'

import { transformStatement } from './tranform-plugin/transformStatement'

export default function baseCompile(
    scss: string,
    options: CompilerOptions = {
        filename: 'default.scss',
        source: ''
    }
) {
    let ast = baseParse(scss, options)

    transform(ast, {
        nodeTransforms: [transformStatement],
        ...options
    })

    return generate(ast, options)
}