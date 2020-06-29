import { CompilerOptions } from './options'
import baseParse from './parse'
// import module from './transforms/module'
// transformChain will be slowly replaced by transform plugins
import transformChain from './transform/index'
import { generate } from './codegen'
import { transform } from './transform'

export default function baseCompile(scss: string, options: CompilerOptions = {}) {
    let ast = baseParse(scss)

    // transformChain will be slowly replaced by transform plugins
    ast = transformChain(ast, options.sourceDir)

    transform(ast, {
        nodeTransforms: [],
        ...options
    })


    return generate(ast)
}