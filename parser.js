function input_stream(input) {
    var pos = 0, line = 1, col = 0;
    return {
        next: next,
        peek: peek,
        eof: eof,
        croak: croak,
    };
    function next() {
        var ch = input.charAt(pos++);
        if (ch == "\n") line++ , col = 0; else col++;
        return ch;
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


// { type: "punc", value: "(" }           // punctuation: parens((|)), comma(,), semicolon(;) etc.
// { type: "str", value: "12px" } // strings
// { type: "var", value: "$height" }            // identifiers
function lex(input) {
    let current = null;

    return { 
        next,
        peek,
        eof,
        croak: input.croak
    }

    function is_punc(ch) {
        return ",;(){}[]".indexOf(ch) >= 0;
    }

    function skip_comment() {
        read_while(function (ch) { return ch != "\n" });
        input.next();
    }

    function is_assign_char(ch) {
        return ":".indexOf(ch) >= 0;
    }

    function is_base_char(ch){
        return /[a-z0-9_\.\#]/i.test(ch);
    }

    function is_id_start(ch) {
        return /[$]/.test(ch);
    }

    function is_id(ch) {
        return is_id_start(ch) || /[a-z0-9_-]/i.test(ch); // sass变量名限制
    }

    function is_whitespace(ch) {
        return " \t\n".indexOf(ch) >= 0;
    }
    function read_while(predicate) {
        var str = "";
        while (!input.eof() && predicate(input.peek()))
            str += input.next();
        return str;
    }

    function read_assign_char() {
        return {
            type: "assign",
            value: input.next()
        }
    }

    function read_ident() {
        var id = read_while(is_id);
        return {
            type: "var",
            value: id
        };
    }

    //Todos: to parse scenario '10px $top'
    function read_end(endChars) {
        var str = "";
        var isEnded = ch => endChars.indexOf(ch) >= 0;
        // input.next();
        while (!input.eof()) {
            var ch = input.peek();
            if (isEnded(ch)) {
                break;
            } else {
                input.next()
                str += ch;
            }
        }
        return str.trim();
    }
    function read_string() {
        return { 
            type: "str", 
            value: read_end('{:;') 
        };
    }

    function read_next() {
        read_while(is_whitespace);
        if (input.eof()) return null;
        var ch = input.peek();

        if (ch == "/") { //Todos:还未支持多行注释如："/**/",(支持 "//" 这种注释)
            skip_comment();
            return read_next();
        }

        if (is_assign_char(ch)) return read_assign_char();
        if (is_id_start(ch)) return read_ident();
        if (is_punc(ch)) return {
            type: "punc",
            value: input.next()
        };
        if (is_base_char(ch)) return read_string();

        input.croak("Can't handle character: " + ch);
    }

    function peek() {
        return current || (current = read_next());
    }
    function next() {
        var tok = current;
        current = null;
        tok =  tok || read_next();
        // console.log('tok', tok)
        return tok;
    }
    function eof() {
        return peek() == null;
    }

}


/**
 *  Todos: add import modules
 *  
 *  Basic:
 * 
 *  str { type: "str", value: STRING }
 *  var { type: "var", value: NAME }
 *  prog { type:"prog", selector: Selector, prog: [AST...] }   // toplevel
 * 
 *  AST:
 * 
 *  child { type:"child", selector: Selector, children: [AST...] }
 *  assign { type: "assign", operator: ":", left: str | var, right: str | var }
 * 
*/

function parse(input) {
    
    function is_punc(ch) {
        var tok = input.peek();
        return tok && tok.type == "punc" && (!ch || tok.value == ch);
    }

    function is_assign(){
        var tok = input.peek()
        return tok && tok.type === "assign";
    }

    function skip_punc(ch) {
        if (is_punc(ch)) input.next();
        // Todos: no mandatory skip for now
        // else {
        //     input.croak("Expecting punctuation: \"" + ch + "\"");
        // }
    }

    function delimited(start, stop, separator, parser) {
        var a = [], first = true;
        skip_punc(start);
        while (!input.eof()) {
            if (is_punc(stop)) break;
            if (first) first = false; else skip_punc(separator);
            if (is_punc(stop)) break;
            a.push(parser());
        }
        skip_punc(stop);
        return a;
    }

    function parse_assign(left){
        input.next();
        return {
            type: 'assign',
            left: left,
            right: parse_atom()
        }
    }

    function maybe_assign(expr) {

        let result = expr();

        if (is_assign()) {
            return parse_assign(result)
        }
        if (is_punc('{')){
            return parse_child(result)
        }

        return result;
    }

    function parse_atom() {
            let tok = input.peek();
            if (tok.type == "var" || tok.type == "str")
                return input.next();
    }
    
    function parse_expression(){
        return maybe_assign(function(){
            return parse_atom()
        })
    }

    function parse_toplevel() {
        var prog = [];
        while (!input.eof()) {
            prog.push(parse_expression());
            if (!input.eof()) skip_punc(";");
        }
        return { type: "prog", selector:{
            type:'str',
            value:'body'
        }, prog: prog };
    }

    function parse_child(selector) {
        var children = delimited("{", "}", ";", parse_expression);
        if (children.length == 0) return FALSE;
        // if (block.length == 1) return block[0];
        return { type: "child", selector: selector, children: children };
    }

    return parse_toplevel()
}

module.exports = parser = (scss) =>parse(lex(input_stream(scss)));