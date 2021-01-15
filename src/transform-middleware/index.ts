
import transformNest from './transformNest'
import transformExtend from './transformExtend'

export const transformMiddleware = (ast) => [transformNest, transformExtend].reduce((ast, middleware) => {
    return middleware.call(null, ast)
}, ast)