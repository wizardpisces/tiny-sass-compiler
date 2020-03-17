
const compile_var = require('./compile_var.js')
const compile_nested = require('./compile_nested.js')
const compile_extend = require('./compile_extend.js')
const compile_css = require('./compile_css.js')

module.exports = compiler = (ast) => compile_css(compile_extend(compile_nested((compile_var(ast)))));