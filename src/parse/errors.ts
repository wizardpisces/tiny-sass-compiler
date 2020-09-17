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
    const msg = (messages || errorMessages)[code] +'\n' + (additionalMessage || ``)
    const error = new SyntaxError(String(msg)) as CompilerError
    error.code = code
    error.loc = loc
    return error as any
}


export const enum ErrorCodes {
    //parse error
    UNKNONWN_TOKEN_TYPE,
    INVALID_LOC_POSITION,
    EXPECT_TEXT_NODE_AFTER_OPERATOR_NODE,
    UNKNOWN_EXPRESSION_TYPE,
    UNKNOWN_STATEMENT_TYPE,
    UNDEFINED_VARIABLE
}

export const errorMessages: { [code: number]: string } = {
    // parse errors
    [ErrorCodes.UNKNONWN_TOKEN_TYPE]: 'Unknown token type.',
    [ErrorCodes.INVALID_LOC_POSITION]: 'Incorrect sourceLocation. start loc should be smaller than end loc.',
    [ErrorCodes.EXPECT_TEXT_NODE_AFTER_OPERATOR_NODE]: 'Expect text node after operator node.',
    [ErrorCodes.UNKNOWN_EXPRESSION_TYPE]: 'Unknown expression type.',
    [ErrorCodes.UNKNOWN_STATEMENT_TYPE]: 'Unknown statement type.',
    [ErrorCodes.UNDEFINED_VARIABLE]: 'Undefined variable.',
}
