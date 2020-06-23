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

    /**
     * Statement 
     * */
    BODY = 'BODY',
    CHILD = 'CHILD',
    ASSIGN = 'ASSIGN',

    // keyword statement
    IMPORT = 'IMPORT',
    INCLUDE = 'INCLUDE',
    EXTEND = 'EXTEND',
    MIXIN = 'MIXIN',
    ERROR = 'ERROR',

    // choice statement
    IFSTATEMENT = 'IFSTATEMENT',

    //Loops
    EACHSTATEMENT = 'EACHSTATEMENT',

    //
    PROGRAM = 'PROGRAM',

}

export type keywordType = '@extend' | '@mixin' | 'include' | '@import' | '@if' | '@else' | '@error' | '@each'
export type puncType = '(' | ')' | ',' | ';' | '#'
export type arithmeticOperator = '+' | '-' | '*' | '/' | '%'
export type comparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!='

export interface SourceLocation {
    start: Position
    end: Position
    // source: string
}

export interface Position {
    offset: number // from start of file
    line: number
    column: number
}

export interface Node {
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
    start: number
    end: number
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
    value: [TextNode | VariableNode | VarKeyNode | PuncNode | BinaryNode]
}

/* Statement */

export type Statement = 
    BodyStatement 
    | ChildStatement 
    | AssignStatement 
    | ImportStatement 
    | IncludeStatement 
    | ExtendStatement 
    | MixinStatement
    | ErrorStatement
    | IfStatement
    | EachStatement

export interface BodyStatement extends Node {
    type: NodeTypes.BODY
    children: [Statement]
}

export interface ChildStatement extends Node {
    type: NodeTypes.CHILD
    selector: TextNode | PlaceholderNode | ListNode
    children: [Statement]
}

export interface AssignStatement extends Node {
    type: NodeTypes.ASSIGN
    left: VariableNode | TextNode | VarKeyNode
    right: NodeTypes.LIST
}

// keyword statement
export interface ImportStatement extends Node {
    type: NodeTypes.IMPORT
    params: [TextNode]
}

export interface IncludeStatement extends Node {
    type: NodeTypes.INCLUDE
    id: IdentifierNode,
    args: [TextNode | VariableNode | BinaryNode | AssignStatement]
}

export interface ExtendStatement extends Node {
    type: NodeTypes.EXTEND
    param: TextNode | PlaceholderNode
}

export interface MixinStatement extends Node {
    type: NodeTypes.MIXIN
    id: IdentifierNode
    params: [VariableNode | AssignStatement]
    body: BodyStatement
}

export interface ErrorStatement extends Node {
    type: NodeTypes.ERROR
    value: ListNode
}

// choice statement
export interface IfStatement extends Node {
    type: NodeTypes.IFSTATEMENT
    test: BinaryNode
    consequent: BodyStatement
    alternate: IfStatement | BodyStatement | null
}

export interface EachStatement extends Node {
    type: NodeTypes.EACHSTATEMENT
    left: VariableNode
    right: VariableNode
    body: ChildStatement
}


export interface Program extends Node {
    type: NodeTypes.PROGRAM
    prog: [Statement]
}



