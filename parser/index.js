const input_stream = require('./input_stream.js')
const lexical = require('./lexical.js')
const parse = require('./parse.js')

module.exports = parser = (scss) => parse(lexical(input_stream(scss)))