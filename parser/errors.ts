import { Position} from './ast'

export interface CompilerError extends SyntaxError {
    [key:string]:any
    code: ErrorCodes
    position?: Position
}

export function onError(error: CompilerError) {
    throw error
}

export const enum ErrorCodes {
    //parse error
    UNKNONWN_TOKEN_TYPE= 'UNKNONWN_TOKEN_TYPE'
}