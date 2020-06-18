
const transform_module = require('./transform_module.js')
const transform_variable = require('./transform_variable.js')
const tranform_nest = require('./tranform_nest.js')
const transform_extend = require('./transform_extend.js')
const compile_css = require('./compile_css.js')

let transformMiddleware = [transform_module, transform_variable, tranform_nest, transform_extend, compile_css]

module.exports = (ast,sourceDir) => transformMiddleware.reduce((ast,middleware)=>{
    return middleware.call(null, ast, sourceDir)
},ast)