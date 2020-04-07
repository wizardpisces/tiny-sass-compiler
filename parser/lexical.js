/**
 * 
 * @param {input_stream processed stream method} input 
 * { type: "punc", value: "(" }           // punctuation: parens((|)), comma(,), semicolon(;) etc.
 * { type: "str", value: "12px" }
 * { type: "var", value: "$height" }      // identifiers
 * { type: "kw", value: "@extend"}      // "@extend" | "@mixin" | "@include" | "@import" | "@if"
 * { type: "placeholder", value: "%str" }      //  % started string contains op char '%'
 * { type: "op", value: "!=" }            // + - % * / != ==
 */

function lex(input) {
    let current = null;
    let keywords = ' @extend @mixin @include @import @if ';
    let op_chars = ' + - * / % ',
        comparison_op_chars = '!=><',
        comparison_op_tokens = ['==','!=','>=','<=','>','<']

    return {
        next,
        peek,
        eof,
        croak: input.croak
    }

    function is_comment_char(ch) {
        return "/".indexOf(ch) >= 0;
    }

    function is_punc(ch) {
        return ",;(){}#".indexOf(ch) >= 0;// support expr { #{var}:var }
    }

    function is_id_start(ch) {
        return /[$]/.test(ch);
    }

    function skip_comment() {
        read_while(function (ch) { return ch != "\n" });
        input.next();
    }

    function is_op_char(ch) {
        // return "+-*/%=&|<>!".indexOf(ch) >= 0;
        return op_chars.indexOf(' ' + ch + ' ') >= 0;
    }

    function is_comparison_op_char(ch) {
        // return "+-*/%=&|<>!".indexOf(ch) >= 0;
        return comparison_op_chars.indexOf(ch) >= 0;
    }

    function is_comparison_op_tokens(str){
        return comparison_op_tokens.indexOf(str) >=0;
    }

    function is_assign_char(ch) {
        return ":".indexOf(ch) >= 0;
    }

    function is_base_char(ch) {
        return /[a-z0-9_\.\#\@\%\-"'&\[\]]/i.test(ch);
        // return !is_punc(ch);
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
        // console.log('kw',kw)
        if (!is_keyword(kw)) {
            return input.croak(`Unknown keyword ${kw}`)
        }
        return {
            type: 'kw',
            value: kw
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

    function generate_op_token(op) {
        return {
            type: "op",
            value: op
        }
    }

    function read_end(endReg) {
        let str = "";
        let is_ended = ch => endReg.test(ch);
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
        let str = read_end(/[,;{}():\s]/);
        return {
            type: "str",
            value: str
        };
    }

    function maybe_comment(ch) {

        if (is_comment_char(input.peek())) {
            skip_comment();
            return read_next()
        }else{
            // console.log('ch',ch)
            return generate_op_token(ch)
        }
    }

    function maybe_placeholder(ch) {
        if (is_base_char(input.peek())) {
            return {
                type: 'placeholder',
                value: ch + read_while(is_base_char)
            }
        } else {
            // console.log('ch', ch)
            return generate_op_token(ch)
        }
    }

    function maybe_op_token(chStr){
        if (input.peek() === ' '){
            return generate_op_token(chStr);
        }else{
            return {
                type : 'str',
                value: chStr+read_string().value
            };
        }
    }

    function maybe_comparison_op_token(chStr){
        if (is_comparison_op_tokens(chStr)){
            return generate_op_token(chStr);
        }else{
            return {
                type : 'str',
                value: chStr+read_string().value
            };
        }
    }
    
    function read_punc(ch){
        return {
            type:'punc',
            value: ch
        }
    }

    function maybe_punc(ch){
        if (input.peek() === '{'){
            return read_punc(ch);
        }else{
            return {
                type : 'str',
                value : ch+read_string().value
            };
        }
    }

    function read_next() {
        read_while(is_whitespace);
        if (input.eof()) return null;
        var ch = input.peek();

        /**
         * comment //  contains op /
         * Todos:还未支持多行注释如：\/**\/
        */
        if (is_comment_char(ch)) return maybe_comment(input.next()); 
        if (is_placeholder_start(ch)) return maybe_placeholder(input.next());// @extend %message-shared;  contains op '%'
        
        if (is_assign_char(ch)) return read_assign_char();
        if (is_id_start(ch)) return read_ident();
        if (is_punc(ch)) {
            if(ch==='#'){
                return maybe_punc(input.next())
            }
            return read_punc(input.next())
        }
        if (is_keyword_start(ch)) return read_keyword();//eg: @extend .message-shared;
        if (is_op_char(ch)) return maybe_op_token(read_while(is_op_char));
        if (is_comparison_op_char(ch)) return maybe_comparison_op_token(read_while(is_comparison_op_char));
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