/**
 * 
 * @param {input_stream processed stream method} input 
 * { type: "punc", value: "(" }           // punctuation: parens((|)), comma(,), semicolon(;) etc.
 * { type: "str", value: "12px" }
 * { type: "var", value: "$height" }      // identifiers
 * { type: "kw", value: "@extend" }      //  @extend
 * { type: "placeholder", value: "%str" }      //  % started string
 * 
 */

function lex(input) {
    let current = null;
    let keywords = ' @extend ';

    return {
        next,
        peek,
        eof,
        croak: input.croak
    }

    function is_punc(ch) {
        return ",;(){}[]".indexOf(ch) >= 0;
    }

    function is_id_start(ch) {
        return /[$]/.test(ch);
    }

    function skip_comment() {
        read_while(function (ch) { return ch != "\n" });
        input.next();
    }

    function is_assign_char(ch) {
        return ":".indexOf(ch) >= 0;
    }

    function is_base_char(ch) {
        return /[a-z0-9_\.\#\@\%\-]/i.test(ch);
    }

    function is_id_char_limit(ch) {
        return is_id_start(ch) || /[a-z0-9_-]/i.test(ch); // sass变量名限制
    }

    function is_keyword(x) {
        return keywords.indexOf(" " + x + " ") >= 0;
    }

    function is_keyword_start(ch) {
        return ch === '@';
    }

    function is_placeholder_start(ch) {
        return ch === '%';
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

    function read_keyword() {
        var kw = read_while(is_base_char);
        if (!is_keyword(kw)) {
            return input.croak(`Unknown keyword ${kw}`)
        }
        return {
            type: 'kw',
            value: kw
        };
    }

    function read_placeholder() {
        var placeholder = read_while(is_base_char);
        return {
            type: 'placeholder',
            value: placeholder.trim()
        };
    }

    function read_assign_char() {
        return {
            type: "assign",
            value: input.next()
        }
    }

    function read_ident() {
        var id = read_while(is_id_char_limit);
        return {
            type: "var",
            value: id.trim()
        };
    }

    function read_end(endChars) {
        var str = "";
        var is_ended = ch => endChars.indexOf(ch) >= 0;
        // input.next();
        while (!input.eof()) {
            var ch = input.peek();
            if (is_ended(ch)) {
                break;
            } else {
                input.next()
                str += ch;
            }
        }
        return str.trim();
    }
    function read_string() {
        let str = read_end('{:;');
        return {
            type: "str",
            value: str
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

        if (is_keyword_start(ch)) return read_keyword();// @extend .message-shared;
        if (is_placeholder_start(ch)) return read_placeholder();// @extend %message-shared;

        if (is_base_char(ch)) return read_string();

        input.croak("Can't handle character: " + ch);
    }

    function peek() {
        return current || (current = read_next());
    }
    function next() {
        var tok = current;
        current = null;
        tok = tok || read_next();
        // console.log('tok', tok)
        return tok;
    }
    function eof() {
        return peek() == null;
    }

}

module.exports = lex;