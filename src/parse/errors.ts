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
    messages?: { [code: number]: string },
    additionalMessage?: string
): T extends ErrorCodes ? CoreCompilerError : CompilerError {
    const msg = (messages || errorMessages)[code] + (additionalMessage || ``)
    const error = new SyntaxError(String(msg)) as CompilerError
    error.code = code
    error.loc = loc
    return error as any
}


export const enum ErrorCodes {
    //parse error
    UNKNONWN_TOKEN_TYPE
}

export const errorMessages: { [code: number]: string } = {
    // parse errors
    [ErrorCodes.UNKNONWN_TOKEN_TYPE]: 'Unknown token type.'
}
