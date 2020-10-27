import {
    NodeTypes,
    RootNode,
    TextNode,
    DeclarationStatement,
    RuleStatement,
    CodegenNode,
    ProgCodeGenNode,
    Position,
    SelectorNode
} from './parse/ast';
import { CodegenOptions } from './options'
import { advancePositionWithMutation} from './parse/util'
import { SourceMapGenerator, RawSourceMap } from 'source-map'
import { applyPlugins} from './pluginManager'
// todos complete CodegenNode type
import { isBrowser} from './global'
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
    push(code: string, node?: CodegenNode): void
    indent(): void
    deindent(withoutNewLine?: boolean): void
    newline(): void
}

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
        push(code: string, node) {
            context.code += code
            if (!isBrowser() && context.map) {
                if (node) {
                    addMapping(node.loc.start,node.loc.filename)
                }
                
                advancePositionWithMutation(context, code)

                // end info is not needed for now ,which could compress source-map size
                // if(node) {
                //     addMapping(node.loc.end)
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

    function addMapping(loc: Position, filename:string, name?: string) {
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
    (ast.children as ProgCodeGenNode[]).forEach((node: ProgCodeGenNode) => genNode(node, context, ast.children as ProgCodeGenNode[] ));

    return {
        ast,
        code: context.code,
        // SourceMapGenerator does have toJSON() method but it's not in the types
        map: context.map ? (context.map as any).toJSON() : undefined
    }
}

function genNode(
    node: CodegenNode,
    context: CodegenContext,
    list: CodegenNode[]
) {
    if(!node){
        console.error('node',node,'context',context)
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
            genAssign(node as DeclarationStatement, context);
            break;
        case NodeTypes.RULE:
            genChild(node as RuleStatement, context, list);
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
    context.push(node.value, node)
}
function genSelector(
    node: SelectorNode,
    context: CodegenContext
) {
    context.push(node.value.value as string, node)
}

function genAssign(
    node: DeclarationStatement,
    context: CodegenContext
) {
    const { push } = context;

    genText(node.left as TextNode, context)
    push(':')
    genText(node.right as TextNode, context)
    push(';');
}

function genChild(
    node: CodegenNode,
    context: CodegenContext,
    list: CodegenNode[]
) {
    const { push, deindent, indent, newline} = context;
    genNode(node.selector,context,list);
    push('{');
    indent();

    (node.children as CodegenNode[]).forEach((child: CodegenNode,index:number) => {
        if (index && child.type !== NodeTypes.EMPTY) {
            newline()
        }
        genNode(child, context, node.children as CodegenNode[]);
    })

    deindent();
    push('}');
    newline();
}