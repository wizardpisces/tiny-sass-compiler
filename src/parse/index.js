import input_stream  from './input_stream.js'
import lexical from './lexical.js'
import parse from './parse.js'
import schema_check from './schema_check'

export default (scss) => schema_check(parse(lexical(input_stream(scss))))