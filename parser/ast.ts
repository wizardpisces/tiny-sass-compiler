export const enum NodeTypes {
    TEXT = 'TEXT',
    VARIABLE = 'VARIABLE',
    PUNC = 'PUNC',
    OPERATOR = 'OPERATOR',
    VAR_KEY = 'VAR_KEY',
    PLACEHOLDER = 'PLACEHOLDER',
    
    LIST = 'LIST',
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

export interface VarKeyNode extends Node{
    type: NodeTypes.VAR_KEY
    start:number
    end: number
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



