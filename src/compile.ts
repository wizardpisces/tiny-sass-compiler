import { CompilerOptions } from './options'
import baseParse from './parse'
import { generate } from './codegen'
import { transform } from './transform'
import {Environment} from './parse/util'

import {transformStatement} from './tranform-plugin/transformStatement'

export default function baseCompile(scss: string, options: CompilerOptions = { env : new Environment(null)}) {
    
    let ast = baseParse(scss)
    
    ast.source = scss;

    transform(ast, {
        nodeTransforms: [transformStatement],
        ...options
    })

    return generate(ast,options)
}