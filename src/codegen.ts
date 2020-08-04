import {
    NodeTypes,
    RootNode,
    TextNode,
    AssignStatement,
    ChildStatement,
    CodegenNode,
    ProgCodeGenNode,
    Position
} from './parse/ast';
import { CodegenOptions } from './options'
import { SourceMapGenerator, RawSourceMap } from 'source-map'

// todos complete CodegenNode type

export interface CodegenResult {
    code: string
    ast: RootNode
    map?: RawSourceMap
}

export interface CodegenContext extends Required<CodegenOptions> {
    source: string
    code: string
    line: number
    column: number
    offset: number
    map?: SourceMapGenerator
    push(code: string, node?: CodegenNode): void
}

function createCodegenContext(
    ast: RootNode,
    {
        sourceMap = false,
        filename = 'template.scss'
    }: CodegenOptions
): CodegenContext {
    const context: CodegenContext = {
        code: '',
        sourceMap,
        filename,
        column: 1,
        line: 1,
        offset: 0,
        //Todos source: ast.loc.source,
        source: 'Todos: source code example which needs to be replaced to real source code(ast.loc.source)',
        push(code: string, node) {
            context.code += code
            if (context.map) {
                if (node) {
                    addMapping(node.loc.start)
                }
            }
        }
    }

    function addMapping(loc: Position, name?: string) {
        context.map!.addMapping({
            name,
            source: context.filename,
            original: {
                line: loc.line,
                column: loc.column - 1 // source-map column is 0 based
            },
            generated: {
                line: context.line,
                column: context.column - 1
            }
        })
    }

    if (sourceMap) {
        context.map = new SourceMapGenerator()
        context.map!.setSourceContent(filename, context.source)
    }

    return context
}

export function generate(
    ast: RootNode,
    options: CodegenOptions = {}
): CodegenResult {
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
    if(!node){
        console.log('node',node,'context',context)
        return;
    }
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node as TextNode, context);
            break;
        case NodeTypes.ASSIGN:
            genAssign(node as AssignStatement, context);
            break;
        case NodeTypes.CHILD:
            genChild(node as ChildStatement, context);
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

function genAssign(
    node: AssignStatement,
    context: CodegenContext
) {
    genNode(node.left as TextNode, context)
    context.push(':')
    genNode(node.right as TextNode, context)
    context.push(';');
}

function genChild(
    node: CodegenNode,
    context: CodegenContext
) {
    context.push(node.selector.value + '{');
    (node.children as CodegenNode[]).forEach((node: CodegenNode) => genNode(node, context));
    context.push('}');
}