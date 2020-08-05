
import tranform_nest from './tranform_nest.js'
import transform_extend from './transform_extend.js'
import transform_module from './transform_module.js'

export {
    transform_module
}

let transformMiddleware = [ tranform_nest, transform_extend]

export default (ast,sourceDir) => transformMiddleware.reduce((ast,middleware)=>{
    return middleware.call(null, ast, sourceDir)
},ast)