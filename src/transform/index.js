
import transform_module from './transform_module.js'
import transform_variable from './transform_variable.js'
import tranform_nest from './tranform_nest.js'
import transform_extend from './transform_extend.js'

let transformMiddleware = [transform_module, transform_variable, tranform_nest, transform_extend]

export default (ast,sourceDir) => transformMiddleware.reduce((ast,middleware)=>{
    return middleware.call(null, ast, sourceDir)
},ast)