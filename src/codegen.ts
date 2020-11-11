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
    MediaQuery,
    SourceLocation,
    MediaPrelude
} from './parse/ast';
import { SourceMapGenerator } from 'source-map'
import { advancePositionWithMutation, isEmptyNode } from './parse/util'
import { applyPlugins } from './pluginManager'
// todos complete CodegenNode type
import { isBrowser } from './global'
import { CodegenContext, CodegenResult, CodegenOptions} from './type'

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
    context.push(node.value, node.loc)
}

function genSelector(
    node: SelectorNode,
    context: CodegenContext
) {
    try{
        context.push(node.value.value as string, node.loc)
    }catch(e){
        console.log('*********** genSelector **************',e)
    }
}

function genDeclaration(
    node: DeclarationStatement,
    context: CodegenContext
) {
    const { push } = context;

    genText(node.left as TextNode, context)
    push(':')
    genText(node.right as TextNode, context)
    push(';');
}

function genRule(
    node: RuleStatement,
    context: CodegenContext
) {
    genNode(node.selector, context);
    genChildrenIterator(node.children as CodegenNode[], context)
}

function genAtRule(node: AtRule, context: CodegenContext) {
    const { push } = context;
    function genMedia(node: MediaStatement, context: CodegenContext) {

        function genMediaQueryPrelude(node: MediaPrelude) {
            let prelude: string = node.children.map((mediaQuery: MediaQuery) => {
                return mediaQuery.children.map(child => {
                    if (child.type === NodeTypes.MediaFeature) {
                        return `(${child.name}:${child.value.value})`
                    } else if(child.type === NodeTypes.TEXT){ // csstree name Identifier eg: screen , and etc
                        return child.value
                    }
                }).join(' ');
            }).join(',');

            push(prelude)
        }

        context.push('@media')
        genMediaQueryPrelude(node.prelude)
        genChildrenIterator(node.block.children as CodegenNode[], context)
    }

    switch (node.name) {
        case 'media':
            genMedia(node as MediaStatement, context);
            break;
    }
}

function genChildrenIterator(children: CodegenNode[], context: CodegenContext) {
    const { push, deindent, indent, newline } = context;
    push('{');
    indent();

    children.forEach((child: CodegenNode, index: number) => {
        if (index && !isEmptyNode(child)) {
            newline()
        }
        genNode(child, context);
    })
    deindent();
    push('}');
    newline();
}