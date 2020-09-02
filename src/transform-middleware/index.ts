
import tranform_nest from './tranform_nest'
import transform_extend from './transform_extend'
import transform_module from './transform_module'

export {
    transform_module
}

let transformMiddleware = [ tranform_nest, transform_extend]

export default (ast) => transformMiddleware.reduce((ast,middleware)=>{
    return middleware.call(null, ast)
},ast)