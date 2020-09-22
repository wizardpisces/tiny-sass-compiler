import { SourceLocation} from './ast'

export interface CompilerError extends SyntaxError {
    code: ErrorCodes
    loc?: SourceLocation
}
export interface CoreCompilerError extends CompilerError {
    code: ErrorCodes
}

export function defaultOnError(error: CompilerError) {
    throw error
}

export function createCompilerError<T extends number>(
    code: T,
    loc?: SourceLocation,
    additionalMessage?: string,
    messages?: { [code: number]: string },
): T extends ErrorCodes ? CoreCompilerError : CompilerError {
    let msg = (messages || errorMessages)[code];
    if(typeof msg === 'function'){
        msg = msg(additionalMessage);
    }else{
        msg +='\n' + (additionalMessage || ``)
    }
    const error = new SyntaxError(String(msg)) as CompilerError
    error.code = code
    error.loc = loc
    return error as any
}


export const enum ErrorCodes {
    //parse error
    UNKNONWN_TOKEN_TYPE,
    UNKNOWN_CHAR,
    INVALID_LOC_POSITION,
    EXPECT_TEXT_NODE_AFTER_OPERATOR_NODE,
    EXPECTED_X,   
    UNKNOWN_EXPRESSION_TYPE,
    UNKNOWN_STATEMENT_TYPE,
    UNDEFINED_VARIABLE,
    UNKNOWN_EVALUATE_BINARY_TYPE,
    EXPECT_BINARY_COMPUTE_TO_BE_NUMBER,
    UNKNOWN_KEYWORD,

}

export const errorMessages: { [code: number]: string | Function } = {
    // parse errors
    [ErrorCodes.UNKNONWN_TOKEN_TYPE]: 'Unknown token type.',
    [ErrorCodes.UNKNOWN_CHAR]: 'Unknown char.',
    [ErrorCodes.INVALID_LOC_POSITION]: 'Incorrect sourceLocation. start loc should be smaller than end loc.',
    [ErrorCodes.EXPECT_TEXT_NODE_AFTER_OPERATOR_NODE]: 'Expect text node after operator node.',
    [ErrorCodes.EXPECTED_X]: (str: string) =>`Expected "${str}"`,
    [ErrorCodes.UNKNOWN_EXPRESSION_TYPE]: 'Unknown expression type.',
    [ErrorCodes.UNKNOWN_STATEMENT_TYPE]: 'Unknown statement type.',
    [ErrorCodes.UNDEFINED_VARIABLE]: 'Undefined variable.',
    [ErrorCodes.UNKNOWN_EVALUATE_BINARY_TYPE]: 'Unknown evaluate binary type.',
    [ErrorCodes.EXPECT_BINARY_COMPUTE_TO_BE_NUMBER]: 'Expect binary compute to be number.',
    [ErrorCodes.UNKNOWN_KEYWORD]: 'Unknown keyword.',
}
