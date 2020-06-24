import {
    NodeTypes,
    RootNode,
    TextNode,
    AssignStatement,
    ChildStatement,
    AfterTransformProgNode,
} from './parse/ast';
import { CodegenOptions } from './options'

export interface CodegenResult {
    code: string
    ast: RootNode
    // todos source-map.ts
    // map?: RawSourceMap
}

export interface CodegenContext extends Required<CodegenOptions> {
    code: string
    push(code: string): void
}

function createCodegenContext(
    ast: RootNode,
    {
        sourceMap = false,
    }: CodegenOptions
): CodegenContext {
    const context: CodegenContext = {
        code: ``,
        sourceMap,
        push(code: string) {
            context.code += code
        }
    }

    return context;
}

export function generate(ast: RootNode, options: CodegenOptions = {}): CodegenResult {
    const context = createCodegenContext(ast, options)

    function compile(exp: AfterTransformProgNode): string {
        switch (exp.type) {
            case NodeTypes.TEXT:
                return css_str(exp as TextNode);
            case NodeTypes.ASSIGN:
                return css_assign(exp as AssignStatement);
            case NodeTypes.CHILD:
                return css_child(exp as ChildStatement);
            case NodeTypes.EMPTY:
                return '';

            default:
                throw new Error("Don't know how to compile expression for " + JSON.stringify(exp));
        }
    }

    function css_str(exp: TextNode): string {
        return exp.value;
    }

    function css_assign(exp: AssignStatement): string {
        return compile(exp.left as TextNode) + ':' + compile(exp.right as TextNode) + ';';
    }

    function css_child(exp: AfterTransformProgNode): string {
        return exp.selector.value + '{' + ( exp.children as AfterTransformProgNode[] ).map((child: AfterTransformProgNode): string => compile(child)).join('') + '}';
    }

    function toplevel(ast: RootNode, context: CodegenContext): CodegenResult {
        const { push } = context;
        push( ( ast.prog as AfterTransformProgNode[] ).map((exp: AfterTransformProgNode): string => compile(exp)).join(''));

        return {
            ast,
            code: context.code,
        }
    }

    return toplevel(ast, context);
}