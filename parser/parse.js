
/**
 *  Todos: add import modules
 *  
 *  @param {lex processed stream method} input
 * 
 *  Basic:
 * 
 *  str { type: "str", value: STRING }  // str = (\s+str\s+ | \s+var\s+)+
 *  var { type: "var", value: NAME }
 *  prog { type:"prog", selector: str, prog: [AST...] }   // toplevel
 *  extend { type:"@extend",body: str | placeholder } 
 * 
 *  AST:
 * 
 *  child { type:"child", selector: str | placeholder, children: [AST...] }
 *  assign { type: "assign", operator: ":", left: str | var, right: str | var }
 * 
*/

function parse(input) {

    function is_punc(ch) {
        var tok = input.peek();
        return tok && tok.type == "punc" && (!ch || tok.value == ch);
    }

    function is_kw(kw) {
        var tok = input.peek();
        return tok && tok.type == "kw" && (!kw || tok.value == kw);
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

    function parse_assign(left) {
        input.next();
        return {
            type: 'assign',
            left: left,
            right: parse_atom()
        }
    }

    function parse_extend() {
        return {
            type: '@extend',
            body: input.next()
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
        if (tok.type === "var" || tok.type === "str" || tok.type === "placeholder")
            return input.next();
    }

    function parse_expression() {
        return maybe_assign(function () {
            return parse_atom()
        })
    }

    function parse_toplevel() {
        var prog = [];
        while (!input.eof()) {
            prog.push(parse_expression());
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