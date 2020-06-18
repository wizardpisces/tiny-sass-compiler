export const enum NodeTypes {
    TEXT = 'TEXT',  // TEXT = (TEXT\s+ | TEXT\s+)*
    VARIABLE = 'VARIABLE', // VARIABLE.value === variable's name , expression deleted after evaluation
    PUNC = 'PUNC',  // punctuation: parens((|)), comma(,), semicolon(;) etc.
    OPERATOR = 'OPERATOR',   // arithmeticOperator | comparisonOperator
    VAR_KEY = 'VAR_KEY', // to solve "TEXT-#{VARIABLE}" , expression replaced after evaluation
    PLACEHOLDER = 'PLACEHOLDER', // %TEXT
    /**
     * https://sass-lang.com/documentation/values/lists
     * any expressions separated with spaces or commas count as a list;
     * iterable eg: $each value in list
    */
    LIST = 'LIST',
    BINARY = 'BINARY',
}

export type puncType = '(' | ')' | ',' | ';' | '#'
export type arithmeticOperator = '+' | '-' | '*' | '/' | '%'
export type comparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!='

export interface SourceLocation {
    start?: number
    end?: number
}

export interface Node extends SourceLocation{
    type: NodeTypes
}

// Simple Node
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



