
const transform_variable = require('./transform_variable.js')
const tranform_nest = require('./tranform_nest.js')
const transform_extend = require('./transform_extend.js')
const compile_css = require('./compile_css.js')

module.exports = compiler = (ast) => compile_css(transform_extend(tranform_nest((transform_variable(ast)))));