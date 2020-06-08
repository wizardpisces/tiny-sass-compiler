const input_stream = require('./input_stream.js')
const lexical = require('./lexical.js')
const parse = require('./parse.js')
const schema_check = require('./schema_check')

module.exports = parser = (scss) => schema_check(parse(lexical(input_stream(scss))))