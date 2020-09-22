import {
    defaultOnError,
    ErrorCodes,
    createCompilerError
} from './errors';
import {
    SourceLocation,
}from './ast'

function input_stream(input: string, filename:string) {

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
        
        if (ch == "\n") line++ , column = 1; else column++;
        
        return ch;
    }

    function setCoordination(coordination) {
        offset = coordination.offset;
        line = coordination.line;
        column = coordination.column;
    }

    function getCoordination(){
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