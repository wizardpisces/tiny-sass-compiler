
/**
 *  Todos: add import modules
 *  
 *  @param {lex processed stream method} input
 * 
 *  Basic ast:
 * 
 *  str { type: "str", value: STRING }  // str = (str\s+ | var\s+)*
 *  var { type: "var", value: NAME }
 *  prog { type:"prog", selector: str, prog: [AST...] }   // toplevel
 *  extend { type:"@extend",body: str | placeholder } 
 *  list {type:"list",value:[AST]}
 * 
 *  complicated AST:
 * 
 *  binary { type: "binary", operator: OPERATOR, left: str|var|binary, right: str|var|binary } // + | - | * | /
 *  assign { type: "assign", operator: ":", left: str | var, right: list[str|var|binary] }
 *  child { type:"child", selector: str | placeholder, children: [AST...] }
*/

function parse(input) {
    const PRECEDENCE = {
        "+": 10, "-": 10,
        "*": 20, "/": 20, "%": 20,
    };
    function is_punc(ch) {
        var tok = input.peek();
        return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
    }

    function is_kw(kw) {
        var tok = input.peek();
        return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
    }

    function is_op(op) {
        var tok = input.peek();
        return tok && tok.type == "op" && (!op || tok.value == op) && tok;
    }

    function is_assign() {
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

    function read_while(predicate) {
        var tokens = [];
        while (!input.eof() && predicate(input.peek()))
            tokens.push(input.next());
        return tokens;
    }

    function maybe_binary(left,left_prec){
        let tok = is_op()
        if (tok){
            if (PRECEDENCE[tok.value] > left_prec){
                input.next();//skip op
                return maybe_binary({
                    type:"binary",
                    operator: tok.value,
                    left: left,
                    right: maybe_binary(parse_atom(), PRECEDENCE[tok.value])
                }, left_prec)
            }
        }
        return left;
    }

    function parse_assign(left) {
        input.next();
        function parse_assign_right(){
            let right=[]
            while(!is_punc(';')){
                right.push(maybe_binary(parse_atom(),0))
            }
            return right;
        }
        return {
            type: 'assign',
            left: left,
            right: {
                type:'list',
                value: parse_assign_right()
            }
        }
    }

    function parse_extend() {
        return {
            type: '@extend',
            body: input.next()
        }
    }

    function parse_consecutive_str(){
        return {
            type: 'str',
            value : read_while(tok=>tok.type ==='str').map(tok=>tok.value).join(' ')
        }
    }

    function maybe_assign(expr) {

        let result = expr();

        if (is_assign()) {
            return parse_assign(result)
        }
        if (is_punc('{')) {
            return parse_child(result) //passin selector
        }

        return result;
    }

    function parse_atom() {
        if (is_kw('@extend')) {
            input.next()
            return parse_extend();
        }
        let tok = input.peek();
        if (tok.type === "var" || tok.type === "placeholder"){
            return input.next();
        }

        if (tok.type === "str"){
            return parse_consecutive_str()
        }
    }

    function parse_expression() {
        return maybe_assign(function () {
            return parse_atom()
        })
    }

    function parse_toplevel() {
        var prog = [];
        while (!input.eof()) {
            let result = parse_expression()
        // console.log('result', JSON.stringify(result))
            prog.push(result);
            if (!input.eof()) skip_punc(";");
        }
        return { type: "prog", selector: {
            type:"str",
            value:"body"
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

module.exports = parse;