import input_stream from './input_stream'
import lexical from './lexical'
import parse from './parse'
import { RootNode } from './ast'
import { ParserOptions } from '@/options'
// import runtime_schema_check from './runtime_ast_check'

export default function baseParse(
    scss: string,
    options: ParserOptions
): RootNode {
    return parse(lexical(input_stream(scss)), options)
}