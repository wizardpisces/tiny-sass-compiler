export const enum NodeTypes {
    TEXT = 'TEXT',
    VARIABLE = 'VARIABLE',
    LIST = 'LIST',
    PUNC = 'PUNC',
    OPERATOR = 'OPERATOR',
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

export interface TextNode extends Node{
    type: NodeTypes.TEXT
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



