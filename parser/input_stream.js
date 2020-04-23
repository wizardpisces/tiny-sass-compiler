function input_stream(input) {
    let pos = 0, line = 1, col = 0;
    return {
        next,
        peek,
        setCoordination,
        getCoordination,
        eof,
        croak,
    };

    function next() {
        let ch = input.charAt(pos++);
        
        if (ch == "\n") line++ , col = 0; else col++;
        
        return ch;
    }

    function setCoordination(coordination) {
        pos = coordination.pos;
        line = coordination.line;
        col = coordination.col;
    }

    function getCoordination(){
        return {
            pos,
            line,
            col
        }
    }

    function peek() {
        return input.charAt(pos);
    }

    function eof() {
        return peek() == "";
    }
    function croak(msg) {
        throw new Error(msg + " (" + line + ":" + col + ")");
    }
}

module.exports = input_stream;