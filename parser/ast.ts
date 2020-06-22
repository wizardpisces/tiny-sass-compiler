export const enum NodeTypes {
    TEXT = 'TEXT',  // TEXT = (TEXT\s+ | TEXT\s+)*
    VARIABLE = 'VARIABLE', // VARIABLE.value === variable's name , expression deleted after evaluation
    PUNC = 'PUNC',  // punctuation: parens((|)), comma(,), semicolon(;) etc.
    OPERATOR = 'OPERATOR',   // arithmeticOperator | comparisonOperator
    VAR_KEY = 'VAR_KEY', // to solve "TEXT-#{VARIABLE}" , expression replaced after evaluation
    PLACEHOLDER = 'PLACEHOLDER', // %TEXT
    KEYWORD = 'KEYWORD', // keywordType
    /**
     * https://sass-lang.com/documentation/values/lists
     * any expressions separated with spaces or commas count as a list;
     * iterable eg: $each value in list
    */
    LIST = 'LIST',
    BINARY = 'BINARY',

    //statement
    BODY = 'BODY',
    IMPORT = 'IMPORT',
}

export type keywordType = '@extend' | '@mixin' | '@include' | '@import' | '@if' | '@else' | '@error' | '@each'
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

export interface Node{
    type: NodeTypes
    loc: SourceLocation
}

// Simple Node

export interface KeywordNode extends Node { // exists only in lexical
    type: NodeTypes.KEYWORD
    value: string
}

export interface TextNode extends Node{
    type: NodeTypes.TEXT
    start:number
    end: number
    value: string
}

export interface VariableNode extends Node{
    type: NodeTypes.VARIABLE
    value: string
}

export interface VarKeyNode extends Node{
    type: NodeTypes.VAR_KEY
    value: string
}

export interface PuncNode extends Node{
    type: NodeTypes.PUNC
    value: puncType
}

export interface OperatorNode extends Node{
    type: NodeTypes.OPERATOR
    value: arithmeticOperator | comparisonOperator
}

// combined node
export interface BinaryNode extends Node{
    type: NodeTypes.BINARY 
    operator: OperatorNode // + | - | * | / | %
    left: TextNode | VariableNode | BinaryNode
    right: TextNode | VariableNode | BinaryNode
}

export interface ListNode extends Node{
    type: NodeTypes.LIST
    value: [TextNode | VariableNode | VarKeyNode | PuncNode | BinaryNode]
}

// statement

export type Statement = BodyStatement

export interface BodyStatement extends Node {
    type: NodeTypes.BODY
    value: [Statement]
}

// keywords
export interface ImportStatement extends Node {
    type: NodeTypes.IMPORT
    params: [TextNode]
}



