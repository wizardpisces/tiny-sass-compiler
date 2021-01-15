import {
    RootNode,
    Position,
    SourceLocation,
} from './parse/ast';
import { SourceMapGenerator } from 'source-map'
import { advancePositionWithMutation } from './parse/util'
import { traverse } from './traverse'
// todos complete CodegenNode type
import { isBrowser } from './global'
import { CodegenContext, CodegenResult, CodegenOptions } from './type'
import { genCodeVisitor } from './genCodeVisitor';

function createCodegenContext(
    ast: RootNode,
    {
        sourceMap = false
    }: CodegenOptions
): CodegenContext {
    const context: CodegenContext = {
        code: '',
        sourceMap,
        column: 1,// source-map column is 0 based
        line: 1,
        offset: 0,
        indentLevel: 0,
        // source: ast.source,
        push(code: string, sourceLoc: SourceLocation) {
            function isValidSourceLocation(sourceLoc: SourceLocation) {
                return sourceLoc && sourceLoc.end.offset > 0;
            }
            context.code += code
            if (!isBrowser() && context.map) {
                if (isValidSourceLocation(sourceLoc)) {
                    addMapping(sourceLoc.start, sourceLoc.filename)
                }

                advancePositionWithMutation(context, code)

                // end info is not needed for now ,which could compress source-map size
                // if(sourceLoc) {
                //     addMapping(sourceLoc.sourceLoc.end)
                // }
            }
        },
        indent() {
            newline(++context.indentLevel)
        },
        deindent(withoutNewLine = false) {
            if (withoutNewLine) {
                --context.indentLevel
            } else {
                newline(--context.indentLevel)
            }
        },
        newline() {
            newline(context.indentLevel)
        }
    }

    function newline(n: number) {
        context.push('\n' + `  `.repeat(n))
    }

    function addMapping(loc: Position, filename: string, name?: string) {
        context.map!.addMapping({
            name,
            source: filename,
            original: {
                line: loc.line,
                column: loc.column - 1
            },
            generated: {
                line: context.line,
                column: context.column - 1
            }
        })
    }

    if (!isBrowser() && sourceMap) {
        context.map = new SourceMapGenerator()
        Object.keys(ast.fileSourceMap).forEach(filename => context.map!.setSourceContent(filename, ast.fileSourceMap[filename]))
    }

    return context
}

export function generate(
    ast: RootNode,
    options: CodegenOptions = {}
): CodegenResult {

    // run plugins automatically before codegen
    traverse.applyPlugins(ast);

    const context = createCodegenContext(ast, options);

    // reset Plugin to prevent user registered plugins from being executed multiple times
    traverse.resetPlugin().registerPlugin(genCodeVisitor(context)).applyPlugins(ast);

    return {
        ast,
        code: context.code,
        // SourceMapGenerator does have toJSON() method but it's not in the types
        map: context.map ? (context.map as any).toJSON() : undefined
    };
}