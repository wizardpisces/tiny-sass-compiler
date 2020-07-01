import { CompilerOptions } from './options'
import baseParse from './parse'
// transformChain will be slowly replaced by transform plugins
import transformChain from './transform/index'
import { generate } from './codegen'
import { transform } from './transform'
import transform_import from './transform/transform_module'
import {Environment} from './parse/util'

import {transformStatement} from './tranforms/transformStatement'

export default function baseCompile(scss: string, options: CompilerOptions = { env : new Environment(null)}) {
    let ast = baseParse(scss)

    // transformChain will be slowly replaced by transform plugins
    ast = transform_import(ast, options.sourceDir)

    transform(ast, {
        nodeTransforms: [transformStatement],
        ...options
    })
    
    // console.log('ast',ast)

    ast = transformChain(ast, options.sourceDir)

    return generate(ast)
}