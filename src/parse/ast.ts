export enum NodeTypes {
    TEXT = 'TEXT',  // TEXT = (TEXT\s+ | TEXT\s+)*
    VARIABLE = 'VARIABLE', // VARIABLE.value === variable's name , expression deleted after evaluation
    PUNC = 'PUNC',  // punctuation: parens((|)), comma(,), semicolon(;) etc.
    OPERATOR = 'OPERATOR',   // arithmeticOperator | comparisonOperator
    VAR_KEY = 'VAR_KEY', // to solve "TEXT-#{VARIABLE}" , expression replaced after evaluation
    PLACEHOLDER = 'PLACEHOLDER', // %TEXT
    KEYWORD = 'KEYWORD',
    IDENTIFIER = 'IDENTIFIER',
    EMPTY = 'EMPTY',
    UNKNOWN = 'UNKNOWN',
    SELECTOR = 'SELECTOR',
    /**
     * https://sass-lang.com/documentation/values/lists
     * any expressions separated with spaces or commas count as a list;
     * iterable eg: $each value in list
    */
    LIST = 'LIST',
    BINARY = 'BINARY',
    CALL = 'CALL',

    /**
     * Statement 
     * */
    BLOCK = 'BLOCK',
    BODY = 'BODY',
    RULE = 'RULE',
    DECLARATION = 'DECLARATION',

    // keyword statement
    PLUGIN = 'PLUGIN',
    IMPORT = 'IMPORT',
    INCLUDE = 'INCLUDE',// use mixin
    EXTEND = 'EXTEND',// combind repeated css
    MIXIN = 'MIXIN', // allow you to define styles that can be re-used throughout your RootNode.
    CONTENT = 'CONTENT',// must end with @return
    FUNCTION = 'FUNCTION',// must end with @return

    /**
     * internal Atrule
     */
    MediaFeature = 'MediaFeature',
    MediaPrelude = 'MediaPrelude',
    KeyframesPrelude = 'KeyframesPrelude',
    MediaQuery = 'MediaQuery',
    Atrule = 'Atrule',

    // exceptions
    ERROR = 'ERROR',

    // control flow
    RETURN = 'RETURN',// always return a text

    // choice statement
    IFSTATEMENT = 'IFSTATEMENT',

    //Loops
    EACHSTATEMENT = 'EACHSTATEMENT',

    RootNode = 'RootNode',

}
/**
 * new keyword add steps
 * 0. add test cases to test folder
 * 1. modify ast.ts (add new Node ast etc)
 * 2. modify lexical keywords
 * 4. 
 */

export type keywordType = '@extend'
    | '@mixin' | '@content' | '@include'
    | '@import'
    | '@if' | '@else'
    | '@error'
    | '@each'
    | '@function' | '@return'
    | '@plugin'

export type internalAtRuleNames = 'media' | 'keyframes' | 'support' | 'charset' | 'font-face' | string;

export type puncType = '(' | ')' | ',' | ';' | '#' | '{' | '}'
export type assignPuncType = ':'
export type arithmeticOperator = '+' | '-' | '*' | '/' | '%'
export type comparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!='

export const locStub: SourceLocation = {
    filename: '',
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
}

export interface Position {
    offset: number // from start of file
    line: number
    column: number
}

export interface SourceLocation {
    filename: string
    start: Position
    end: Position
    // source: string
}

export interface Node {
    [key: string]: any
    type: NodeTypes
    loc: SourceLocation
}

export interface TextNode extends Node {
    type: NodeTypes.TEXT
    value: string
}
export interface EmptyNode extends Node {
    type: NodeTypes.EMPTY
}

export interface VariableNode extends Node {
    type: NodeTypes.VARIABLE
    value: string
}
export interface IdentifierNode extends Node {
    type: NodeTypes.IDENTIFIER
    value: string
}
export interface PlaceholderNode extends Node {
    type: NodeTypes.PLACEHOLDER
    value: string
}

export interface VarKeyNode extends Node {
    type: NodeTypes.VAR_KEY
    value: string
}

export interface PuncNode extends Node {
    type: NodeTypes.PUNC
    value: puncType
}

export interface OperatorNode extends Node {
    type: NodeTypes.OPERATOR
    value: arithmeticOperator | comparisonOperator
}

export interface SelectorNode extends Node {
    type: NodeTypes.SELECTOR
    meta: MediaStatement['prelude'][] // helper to trace nested media parent
    value: TextNode | PlaceholderNode | ListNode | EmptyNode
}

// combined node
export interface BinaryNode extends Node {
    type: NodeTypes.BINARY
    operator: OperatorNode
    left: TextNode | VariableNode | BinaryNode
    right: TextNode | VariableNode | BinaryNode
}

export interface ListNode extends Node {
    type: NodeTypes.LIST
    value: SimpleExpressionNode[]
}

export interface CallExpression extends Node {
    type: NodeTypes.CALL
    id: IdentifierNode
    args: ArgsType
}

export type SimpleExpressionNode = TextNode | PuncNode | OperatorNode | VariableNode | VarKeyNode | BinaryNode | ListNode | CallExpression | EmptyNode

/* Statement */

export type Statement =
    BodyStatement
    | RuleStatement
    | DeclarationStatement
    | ImportStatement
    | IncludeStatement
    | ExtendStatement
    | MixinStatement
    | FunctionStatement
    | ErrorStatement
    | IfStatement
    | EachStatement
    | ReturnStatement
    | Atrule
    | PluginStatement

export type ArgsType = (TextNode | VariableNode | BinaryNode | DeclarationStatement)[]

/**
 * used with self designed statement eg: @function @mixin
 * will be deleted after evaluation， so it will not exist in codegen step
 */
export interface BodyStatement extends Node {
    type: NodeTypes.BODY
    children: RuleStatement['children']
}

export interface RuleStatement extends Node {
    type: NodeTypes.RULE
    selector: SelectorNode
    children: (Statement | CodegenNode)[]
}

export interface DeclarationStatement extends Node {
    type: NodeTypes.DECLARATION
    left: VariableNode | TextNode | VarKeyNode
    right: ListNode | TextNode // ListNode before transform , TextNode after transform
}

// keyword statement
export interface ImportStatement extends Node {
    type: NodeTypes.IMPORT
    params: TextNode[]
}
export interface PluginStatement extends Node {
    type: NodeTypes.PLUGIN
    value: TextNode
}

export interface ContentPlaceholder extends Node { // @content
    type: NodeTypes.CONTENT
}

export interface IncludeStatement extends Node {
    type: NodeTypes.INCLUDE
    id: IdentifierNode
    args: ArgsType
    content?: BodyStatement
}

export interface ExtendStatement extends Node {
    type: NodeTypes.EXTEND
    param: TextNode | PlaceholderNode
}

export interface MixinStatement extends Node {
    type: NodeTypes.MIXIN
    id: IdentifierNode
    params: (VariableNode | DeclarationStatement)[]
    body: BodyStatement
}

export interface FunctionStatement extends Node {
    type: NodeTypes.FUNCTION
    id: IdentifierNode
    params: MixinStatement['params']
    body: BodyStatement
}

export interface ReturnStatement extends Node {
    type: NodeTypes.RETURN
    argument: DeclarationStatement['right']
}

export interface ErrorStatement extends Node {
    type: NodeTypes.ERROR
    value: ListNode
}

// choice statement
export interface IfStatement extends Node {
    type: NodeTypes.IFSTATEMENT
    test: BinaryNode | TextNode
    consequent: BodyStatement
    alternate: IfStatement | BodyStatement | null
}

export interface EachStatement extends Node {
    type: NodeTypes.EACHSTATEMENT
    left: VariableNode
    right: VariableNode
    body: RuleStatement
}


/**
 * interface prototype for css internal Atrule eg: @media @keyframes @font-face @charset etc
 * Todos: change @import by Atrule
 */
export interface Atrule extends Node {
    type: NodeTypes.Atrule
    name: internalAtRuleNames
    block: BodyStatement
    prelude: MediaPrelude | KeyframesPrelude
}
/**
 * @media ast tree (simplified) start  
 * (reference: https://github.com/csstree/csstree)
 * eg: When the width is between 600px and 900px OR above 1100px - change the appearance of <div>
 * @media screen and (max-width: 900px) and (min-width: 600px), (min-width: 1100px) {}
 * 
 */
export interface MediaFeature extends Node { // (min-width: 600px)
    type: NodeTypes.MediaFeature
    name: string
    value: SimpleExpressionNode // after transform , in codegen value will be TextNode
}
export interface MediaQuery extends Node {
    type: NodeTypes.MediaQuery
    children: (TextNode | MediaFeature)[] // TextNode contains special identifier: screen | and
}

export interface MediaPrelude extends Node {
    type: NodeTypes.MediaPrelude
    children: MediaQuery[] // splited by ','
}

export interface MediaStatement extends Atrule {
    name: 'media'
    prelude: MediaPrelude
}

export interface KeyframesPrelude extends Node {
    type: NodeTypes.KeyframesPrelude
    children: (TextNode | VarKeyNode)[]
}

export interface Keyframes extends Atrule {
    name: string // keyframes | -webkit-keyframes etc
    prelude: KeyframesPrelude
}

/**
 * @media ast tree end
 */

/* codeGenNode means ast tree that is transformed  */

export type CodegenNode = TextNode | ProgCodeGenNode | RootNode

export type ProgCodeGenNode = RuleStatement | EmptyNode | SelectorNode | DeclarationStatement | Atrule | MediaStatement | MediaPrelude | Keyframes | KeyframesPrelude

export type FileSourceMap = {
    [key: string]: string
}
export interface RootNode extends Node {
    type: NodeTypes.RootNode

    // codeGenNode ,use it to generate source map between files
    fileSourceMap: FileSourceMap

    children: (Statement | CodegenNode)[]
}

// work before ast transform
export function createKeyframesPrelude(children: KeyframesPrelude['children']): KeyframesPrelude {
    return {
        type: NodeTypes.KeyframesPrelude,
        children,
        loc: {
            start: children[0].loc.start,
            end: children[children.length - 1].loc.end,
            filename: children[0].loc.filename
        }
    }
}

export function createKeyframes(name: string, prelude: Keyframes['prelude'], block: Keyframes['block']): Keyframes {
    return {
        type: NodeTypes.Atrule,
        name,
        block,
        prelude,
        loc: {
            start: prelude.loc.start,
            end: block.loc.end,
            filename: prelude.loc.filename
        }
    }
}

export function createMediaFeature(declaration: DeclarationStatement): MediaFeature {
    return {
        type: NodeTypes.MediaFeature,
        name: declaration.left.value,
        value: (declaration.right as ListNode).value[0],
        loc: declaration.loc
    }
}

export function createMediaQuery(children: MediaQuery['children']): MediaQuery {
    return {
        type: NodeTypes.MediaQuery,
        children,
        loc: locStub
    }
}

export function createMediaPrelude(children: MediaPrelude['children']): MediaPrelude {
    return {
        type: NodeTypes.MediaPrelude,
        children,
        loc: locStub
    }
}

export function createMediaStatement(prelude: MediaStatement['prelude'], block: MediaStatement['block']): MediaStatement {
    return {
        type: NodeTypes.Atrule,
        name: 'media',
        block,
        prelude,
        loc: {
            start: prelude.loc.start,
            end: block.loc.end,
            filename: prelude.loc.filename
        }
    }
}

export function createIdentifierNode(id: TextNode): IdentifierNode {
    return {
        loc: id.loc,
        value: id.value,
        type: NodeTypes.IDENTIFIER
    }
}

export function createCallExpression(id: CallExpression['id'], args: CallExpression['args']): CallExpression {
    return {
        type: NodeTypes.CALL,
        id,
        args,
        loc: {
            start: id.loc.start,
            end: args.length ? args[args.length - 1].loc.end : id.loc.end,
            filename: id.loc.filename
        }
    }
}

export function createDeclarationStatement(left: DeclarationStatement['left'], right: DeclarationStatement['right']): DeclarationStatement {
    return {
        type: NodeTypes.DECLARATION,
        left: left,
        right: right,
        loc: {
            start: left.loc.start,
            end: right.length ? right[right.length - 1].loc.end : right.loc.end,
            filename: left.loc.filename
        }
    }
}

export function createListNode(list: SimpleExpressionNode[]): ListNode {
    return {
        type: NodeTypes.LIST,
        value: list,
        loc: {
            start: list[0].loc.start,
            end: list[list.length - 1].loc.end,
            filename: list[0].loc.filename
        }
    }
}

export function createMixinStatement(id: MixinStatement['id'], params: MixinStatement['params'], body: MixinStatement['body']): MixinStatement {
    return {
        type: NodeTypes.MIXIN,
        id,
        params,
        body,
        loc: locStub
    }
}

export function createFunctionStatement(id: FunctionStatement['id'], params: FunctionStatement['params'], body: FunctionStatement['body']): FunctionStatement {
    return {
        type: NodeTypes.FUNCTION,
        id,
        params,
        // always contain a ReturnStatement in the last line
        body,
        loc: locStub
    }
}

export function createReturnStatement(list: SimpleExpressionNode[]): ReturnStatement {
    return {
        type: NodeTypes.RETURN,
        argument: createListNode(list),
        loc: locStub
    }
}

export function createRuleStatement(selector: RuleStatement['selector'], children: RuleStatement['children'], loc: SourceLocation = locStub): RuleStatement {
    return {
        type: NodeTypes.RULE,
        selector,
        children,
        loc
    }
}

export function createContentPlaceholder(loc: ContentPlaceholder['loc'] = locStub): ContentPlaceholder {
    return {
        type: NodeTypes.CONTENT,
        loc
    }
}

export function createIncludeStatement(id: IncludeStatement['id'], args: IncludeStatement['args'], content?: IncludeStatement['content']): IncludeStatement {
    let node: IncludeStatement = {
        type: NodeTypes.INCLUDE,
        id,
        args,
        loc: locStub
    }

    if (content) {
        node.content = content
    }

    return node;
}

export function createIfStatement(test: IfStatement['test'], consequent: IfStatement['consequent'], alternate: IfStatement['alternate']): IfStatement {
    return {
        type: NodeTypes.IFSTATEMENT,
        test,
        consequent,
        alternate,
        loc: locStub
    }
}
export function createEachStatement(left: EachStatement['left'], right: EachStatement['right'], body: EachStatement['body']): EachStatement {
    return {
        type: NodeTypes.EACHSTATEMENT,
        left,
        right,
        body,
        loc: locStub
    }
}

export function createVarKeyExpression(value: VarKeyNode['value'], loc: Node['loc']): VarKeyNode {
    return {
        type: NodeTypes.VAR_KEY,
        value,
        loc
    }
}
export function createTextNode(value: TextNode['value'] = '', loc: Node['loc'] = locStub): TextNode {
    return {
        type: NodeTypes.TEXT,
        value,
        loc
    }
}

export function createSelectorNode(value: SelectorNode['value'] = createTextNode(), meta: SelectorNode['meta'] = []): SelectorNode {
    return {
        type: NodeTypes.SELECTOR,
        meta,
        loc: value.loc,
        value: value
    }
}

export function createEmptyNode(loc: Node['loc'] = locStub): EmptyNode {
    return {
        type: NodeTypes.EMPTY,
        loc
    }
}

export function createBodyStatement(children: BodyStatement['children']): BodyStatement {
    return {
        type: NodeTypes.BODY,
        children,
        loc: locStub
    };
}

export function createRootNode(children: RootNode['children'], fileSourceMap: RootNode['fileSourceMap'], loc: Node['loc'] = locStub): RootNode {
    return {
        type: NodeTypes.RootNode,
        children,
        fileSourceMap,
        loc
    }
}

export function createRuleFromBody(body: BodyStatement): RuleStatement {
    return createRuleStatement(
        createSelectorNode(createTextNode('')),
        body.children
    );
}

export function createRuleFromMedia(media: MediaStatement): RuleStatement {
    return createRuleStatement(
        createSelectorNode(
            createTextNode(''),
            [media.prelude]
        ),
        media.block.children
    );
}

export function createMediaFromRule(rules: RuleStatement[] | RuleStatement): MediaStatement {
    if (!rules.length) {
        rules = [rules as RuleStatement]
    }
    /**
     * merge media prelude list as one glued by 'and' idetifier 
     * */
    function mergeMediaPreludeList(preludeList: MediaStatement['prelude'][]): MediaStatement['prelude'] {

        function mergeMediaPreludeChildren(children: MediaPrelude['children']): MediaQuery {
            let mediaQueryChildren = children.reduce(
                (mediaQueryList: MediaQuery['children'], mediaQuery: MediaQuery) =>
                    mediaQueryList.concat(mediaQuery['children'])
                , [])

            return createMediaQuery(mediaQueryChildren)
        }

        let children: MediaPrelude['children'] = [];

        preludeList.forEach((prelude: MediaStatement['prelude']) => {
            if (children.length > 0) { // push 'and' identifer to glue mediaQuery
                children.push(createMediaQuery([createTextNode('and')]))
            }
            children = children.concat(prelude.children)
        })

        // return mediaPrelude with only one child
        return createMediaPrelude(children.length > 1 ? [mergeMediaPreludeChildren(children)] : children)
    }

    let prelude = mergeMediaPreludeList(
        Array.from(
            new Set(
                rules.reduce(
                    (preludeList: MediaStatement['prelude'][], rule: RuleStatement) =>
                        preludeList.concat(rule.selector.meta)
                    , [])
            )
        )
    )
    // reset rule selector meta
    rules.forEach((rule: RuleStatement) => rule.selector.meta = [])

    return createMediaStatement(prelude, createBodyStatement(rules as RuleStatement[]))
}