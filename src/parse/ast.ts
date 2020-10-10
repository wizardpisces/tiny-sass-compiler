export const enum NodeTypes {
    TEXT = 'TEXT',  // TEXT = (TEXT\s+ | TEXT\s+)*
    VARIABLE = 'VARIABLE', // VARIABLE.value === variable's name , expression deleted after evaluation
    PUNC = 'PUNC',  // punctuation: parens((|)), comma(,), semicolon(;) etc.
    OPERATOR = 'OPERATOR',   // arithmeticOperator | comparisonOperator
    VAR_KEY = 'VAR_KEY', // to solve "TEXT-#{VARIABLE}" , expression replaced after evaluation
    PLACEHOLDER = 'PLACEHOLDER', // %TEXT
    KEYWORD = 'KEYWORD', // keywordType
    IDENTIFIER = 'IDENTIFIER', // keywordType
    EMPTY = 'EMPTY', // keywordType
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
    BODY = 'BODY',
    CHILD = 'CHILD',
    ASSIGN = 'ASSIGN',

    // keyword statement
    IMPORT = 'IMPORT',
    INCLUDE = 'INCLUDE',// use mixin
    EXTEND = 'EXTEND',// combind repeated css
    MIXIN = 'MIXIN', // allow you to define styles that can be re-used throughout your stylesheet.
    FUNCTION = 'FUNCTION',// must end with @return

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

export type keywordType = '@extend' | '@mixin' | 'include' | '@import' | '@if' | '@else' | '@error' | '@each' | '@function' | '@return'


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
    [key:string]:any
    type: NodeTypes
    loc: SourceLocation
}

// Simple Node

export interface KeywordNode extends Node { // exists only in lexical
    type: NodeTypes.KEYWORD
    value: string
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

export type SimpleExpressionNode = TextNode | PuncNode | OperatorNode | VariableNode | VarKeyNode | BinaryNode | ListNode | CallExpression

/* Statement */

export type Statement = 
    BodyStatement 
    | ChildStatement 
    | AssignStatement 
    | ImportStatement 
    | IncludeStatement 
    | ExtendStatement 
    | MixinStatement
    | FunctionStatement
    | ErrorStatement
    | IfStatement
    | EachStatement
    | ReturnStatement

export type ArgsType = (TextNode | VariableNode | BinaryNode | AssignStatement)[]

export interface BodyStatement extends Node {
    type: NodeTypes.BODY
    children: Statement[]
}

export interface ChildStatement extends Node {
    type: NodeTypes.CHILD
    selector: TextNode | PlaceholderNode | ListNode
    children: (Statement | CodegenNode)[]
}

export interface AssignStatement extends Node {
    type: NodeTypes.ASSIGN
    left: VariableNode | TextNode | VarKeyNode
    right: ListNode | TextNode // ListNode before transform , TextNode after transform
}

// keyword statement
export interface ImportStatement extends Node {
    type: NodeTypes.IMPORT
    params: TextNode[]
}

export interface IncludeStatement extends Node {
    type: NodeTypes.INCLUDE
    id: IdentifierNode,
    args: ArgsType
}

export interface ExtendStatement extends Node {
    type: NodeTypes.EXTEND
    param: TextNode | PlaceholderNode
}

export interface MixinStatement extends Node {
    type: NodeTypes.MIXIN
    id: IdentifierNode
    params: (VariableNode | AssignStatement)[]
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
    argument: AssignStatement['right']
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
    body: ChildStatement
}

/* codeGenNode means ast tree that is transformed  */

export type CodegenNode = TextNode | ProgCodeGenNode

export type ProgCodeGenNode = AssignStatement | ChildStatement | EmptyNode;

export type ParentNode = RootNode | BodyStatement | ChildStatement

export type FileSourceMap = {
    [key: string] : string
}
export interface RootNode extends Node {
    type: NodeTypes.RootNode

    // codeGenNode ,use it to generate source map between files
    fileSourceMap: FileSourceMap

    children: (Statement | ProgCodeGenNode)[]
}

export function createIdentifierNode(id:TextNode):IdentifierNode{
    return {
        loc:id.loc,
        value:id.value,
        type:NodeTypes.IDENTIFIER
    }
}

export function createCallExpression(id: CallExpression['id'], args: CallExpression['args']):CallExpression{
    return {
        type:NodeTypes.CALL,
        id,
        args,
        loc:{
            start:id.loc.start,
            end: args.length ? args[args.length-1].loc.end : id.loc.end,
            filename:id.loc.filename
        }
    }
}

export function createAssignStatement(left: AssignStatement['left'], right: AssignStatement['right']): AssignStatement {
    return {
        type: NodeTypes.ASSIGN,
        left: left,
        right: right,
        loc: {
            start:left.loc.start,
            end:right.length ? right[right.length-1].loc.end : right.loc.end,
            filename:left.loc.filename
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

export function createMixinStatement(id:MixinStatement['id'],params:MixinStatement['params'],body:MixinStatement['body']):MixinStatement{
    return {
        type:NodeTypes.MIXIN,
        id,
        params,
        body,
        loc: locStub
    }
}

export function createFunctionStatement(id: FunctionStatement['id'], params: FunctionStatement['params'], body: FunctionStatement['body']):FunctionStatement{
    return {
        type:NodeTypes.FUNCTION,
        id,
        params,
        // always contain a ReturnStatement in the last line
        body,
        loc: locStub
    }
}

export function createReturnStatement(list:SimpleExpressionNode[]):ReturnStatement {
    return {
        type:NodeTypes.RETURN,
        argument: createListNode(list),
        loc: locStub
    }
}
