function input_stream(input) {

    let offset = 0, line = 1, column = 0;
    return {
        next,
        peek,
        setCoordination,
        getCoordination,
        eof,
        croak,
    };

    function next() {
        let ch = input.charAt(offset++);
        
        if (ch == "\n") line++ , column = 0; else column++;
        
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
        return peek() == "";
    }
    function croak(msg) {
        throw new Error(msg + " (" + line + ":" + column + ")");
    }
}

export default input_stream;