
import tranform_nest from './tranformNest'
import transform_extend from './transformExtend'
import transform_module from './transformModule'

export {
    transform_module
}

let transformMiddleware = [ tranform_nest, transform_extend]

export default (ast) => transformMiddleware.reduce((ast,middleware)=>{
    return middleware.call(null, ast)
},ast)