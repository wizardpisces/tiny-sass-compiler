import input_stream  from './input_stream.js'
import lexical from './lexical.js'
import parse from './parse'
import { ParserOptions } from '@/options.js'
// import runtime_schema_check from './runtime_ast_check'

// export default (scss, options) => runtime_schema_check(parse(lexical(input_stream(scss)), options))
export default (scss:string, options:ParserOptions)=>{
    return parse(lexical(input_stream(scss)), options)
}