import {
    defaultOnError,
    ErrorCodes,
    createCompilerError
} from './errors';
import {
    SourceLocation,
    Position
} from './ast'

export type InputStream = {
    next: () => string,
    peek: () => string,
    setCoordination: (position: Position) => void,
    getCoordination: () => Position,
    eof: () => boolean,
    croak: (msg: string) => void,
    emitError: (code: ErrorCodes, loc?: SourceLocation, additionalMessage?: string) => void

}

function input_stream(input: string, filename: string): InputStream {

    let offset = 0, line = 1, column = 1;
    return {
        next,
        peek,
        setCoordination,
        getCoordination,
        eof,
        croak,
        emitError
    };

    function next() {
        let ch = input.charAt(offset++);

        if (ch == "\n") line++, column = 1; else column++;

        return ch;
    }

    function setCoordination(coordination: Position) {
        offset = coordination.offset;
        line = coordination.line;
        column = coordination.column;
    }

    function getCoordination() {
        return {
            offset,
            line,
            column
        }
    }

    function peek() {
        return input.charAt(offset);
    }

    function eof() {
        return peek() === "";
    }

    function croak(msg) {
        throw new Error(msg + " (" + line + ":" + column + ")");
    }

    function emitError(
        code: ErrorCodes,
        loc: SourceLocation = {
            start: getCoordination(),
            end: getCoordination(),
            filename
        },
        additionalMessage: string = ''
    ): void {
        defaultOnError(
            createCompilerError(code, loc, additionalMessage)
        )
    }
}

export default input_stream;