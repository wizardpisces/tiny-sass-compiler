import {
    NodeTypes,
    RootNode,
    TextNode,
    DeclarationStatement,
    RuleStatement,
    CodegenNode,
    ProgCodeGenNode,
    Position,
    SelectorNode,
    AtRule,
    MediaStatement,
    SourceLocation,
} from './parse/ast';
import { SourceMapGenerator } from 'source-map'
import { advancePositionWithMutation } from './parse/util'
import { applyPlugins } from './pluginManager'
// todos complete CodegenNode type
import { isBrowser } from './global'
import { CodegenContext, CodegenResult, CodegenOptions} from './type'
import { Rule, Selector, Text, Declaration, Media } from './tree';

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
            function isValidSourceLocation(sourceLoc: SourceLocation){
                return sourceLoc && sourceLoc.end.offset>0;
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

    applyPlugins(ast);// run plugins automatically before codegen

    const context = createCodegenContext(ast, options);
    (ast.children as ProgCodeGenNode[]).forEach((node: ProgCodeGenNode) => genNode(node, context));

    return {
        ast,
        code: context.code,
        // SourceMapGenerator does have toJSON() method but it's not in the types
        map: context.map ? (context.map as any).toJSON() : undefined
    }
}

function genNode(
    node: CodegenNode,
    context: CodegenContext
) {
    if (!node) {
        console.error('node', node, 'context', context)
        return;
    }

    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node as TextNode, context);
            break;
        case NodeTypes.SELECTOR:
            genSelector(node as SelectorNode, context);
            break;
        case NodeTypes.DECLARATION:
            genDeclaration(node as DeclarationStatement, context);
            break;
        case NodeTypes.RULE:
            genRule(node as RuleStatement, context);
            break;
        case NodeTypes.AtRule:
            genAtRule(node, context);
            break;
        case NodeTypes.EMPTY:
            break;

        default:
            throw new Error("Don't know how to genNode for " + JSON.stringify(node));
    }
}

function genText(
    node: TextNode,
    context: CodegenContext
) {
    new Text(node).genCSS(context);
}

function genSelector(
    node: SelectorNode,
    context: CodegenContext
) {
    new Selector(node).genCSS(context);
}

function genDeclaration(
    node: DeclarationStatement,
    context: CodegenContext
) {

    new Declaration(node).genCSS(context)
}

function genRule(
    node: RuleStatement,
    context: CodegenContext
) {
    new Rule(node).genCSS(context)
}

function genAtRule(node: AtRule, context: CodegenContext) {
    function genMedia(node: MediaStatement, context: CodegenContext) {
        new Media(node).genCSS(context)
    }

    switch (node.name) {
        case 'media':
            genMedia(node as MediaStatement, context);
            break;
    }
}