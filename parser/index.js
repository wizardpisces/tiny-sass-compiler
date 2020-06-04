const input_stream = require('./input_stream.js')
const lexical = require('./lexical.js')
const parse = require('./parse.js')
const error_checking = require('./error_checking')

module.exports = parser = (scss) => error_checking(parse(lexical(input_stream(scss))))