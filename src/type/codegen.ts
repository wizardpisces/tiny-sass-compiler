import { SourceMapGenerator, RawSourceMap } from 'source-map'
import {RootNode,SourceLocation} from '../parse/ast'
import { CodegenOptions } from './options'

export interface CodegenResult {
    code: string
    ast: RootNode
    map?: RawSourceMap
}

export interface CodegenContext extends Required<CodegenOptions> {
    // source: string
    code: string
    indentLevel: number
    line: number
    column: number
    offset: number
    map?: SourceMapGenerator
    push(code: string, sourceLoc?: SourceLocation): void
    indent(): void
    deindent(withoutNewLine?: boolean): void
    newline(): void
}
