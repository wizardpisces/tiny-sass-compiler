
/**
 *  Todos: add import modules
 *  
 *  @param {lex processed stream method} input
 * 
 *  ast unit
 * 
 *  str { type: "str", value: STRING }  // str = (str\s+ | var\s+)*
 *  var { type: "var", value: NAME } // var.value === variable's name string
 *  var_key { type: "var_key", value: NAME } // to solve assign { #{var} : value }
 *  list { type:"list",value:[ ast ] }
 *  body { type:"body", chidren:[ AST ] }
 * 
 *  AST Expression:
 *  
 *  prog { type:"prog", selector: str, prog: [ AST ] }   // toplevel
 *  binary { type: "binary", operator: OPERATOR, left: str | var | binary, right: str | var | binary } // + | - | * | /
 *  @extend { type:"@extend", param: str | placeholder } 
 *  @import { type: "@import", params:[ str ] }
 *  @mixin  { type: "@mixin", id:{ type:"identifier", name:"string" } , params: [ var | assign ], body: body }
 *  @include { type: "@include", id:{ type:"identifier", name:"string" } , args: [ str | var | binary ] }
 *  assign { type: "assign", operator: ":", left: str | var | var_key, right: list [ str | var | binary ] }
 *  child { type:"child", selector: str | placeholder, children: [ AST ] }
*/

const debug = (function(){
    let isDebug = false,
        count = 0;
    return ()=>{
        if(count++>20 && isDebug){
            return true;
        }
        return false;
    }
})()

function parse(input) {
    const PRECEDENCE = {
        "+": 10, "-": 10,
        "*": 20, "/": 20, "%": 20,
    };

    let assign_right_end_condition = default_assign_right_end_condition;

    function default_assign_right_end_condition(){
        return is_punc(';')
    }

    function reset_assign_right_end_condition(){
        assign_right_end_condition = default_assign_right_end_condition
    }

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

    function delimited(start, stop, separator, parser) {// FIFO
        var a = [], first = true;
        skip_punc(start);
        // console.log('start', start);
        while (!input.eof()) {
            if (debug()) break;
            if (is_punc(stop)) break;
            if (first) first = false; else skip_punc(separator);
            if (is_punc(stop)) break;

            let result = parser();

            // console.log('delimited result：', result)
            a.push(result);
        }
        skip_punc(stop);
        return a;
    }

    function maybe_binary(left, left_prec) {
        let tok = is_op()
        if (tok) {
            if (PRECEDENCE[tok.value] > left_prec) {
                input.next();//skip op
                return maybe_binary({
                    type: "binary",
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
        function parse_assign_right() {
            let right = []
            while (!assign_right_end_condition()) {
                if(debug()) break;
                let result = maybe_binary(parse_atom(), 0);
                right.push(result)
            }
            // console.log('parse_assign_right result:',JSON.stringify(right))
            return right;
        }
        return {
            type: 'assign',
            left: left,
            right: {
                type: 'list',
                value: parse_assign_right()
            }
        }
    }

    function parse_child(selector) {
        var children = delimited("{", "}", ";", parse_expression);
        // if (children.length == 0) return FALSE;
        // if (block.length == 1) return block[0];
        return { type: "child", selector, children };
    }

    function maybe_assign(exp) {
        let expr = exp();

        if (is_assign()) {
            return parse_assign(expr)
        }

        if (is_punc('{')) {
            return parse_child(expr) //passin selector
        }

        return expr;
    }

    function parse_extend() {
        return {
            type: '@extend',
            param: input.next()
        }
    }

    function parse_body() {
        let children = delimited("{", "}", ";", parse_expression);
        return { type: "body", children };
    }

    /**
     * Todos: add @content kw and include body
     */
    function parse_mixin() {
        let id = {
            type: "identifier",
            name: input.next().value
        },
        params = [];

        
        if(!is_punc('{')){
            /**
             * Support default params
             * @mixin replace-text($image,$x:default1, $y:default2) {
              */
            assign_right_end_condition = () => is_punc(',') || is_punc(')');

            params = delimited('(', ')', ',', parse_expression);
        }

        reset_assign_right_end_condition()

        return {
            type: "@mixin",
            id,
            params, // %extend like expr or func expr
            body: parse_body()
        }
    }

    function parse_include() {
        let id = {
            type: "identifier",
            name: input.next().value
        }
        return {
            type: "@include",
            id,
            args: is_punc(';') ? [] : delimited('(', ')', ',', parse_expression), // extend like expr or call expr
        }
    }

    function parse_import() {

        function processFilenameExp(exp) {
            exp.value = exp.value.match(/^['"](.+)['"]$/)[1]
            return exp;
        }

        let delimitor = input.peek(),
            params = [];

        if (!delimitor.value.startsWith("'") && !delimitor.value.startsWith('"') ){
            console.log(delimitor.value)
            input.croak(`@import expected with ' or " but encountered ${delimitor}`)
        }

        while(!is_punc(';')){  // @import 'foundation/code', 'foundation/lists';
            params.push( processFilenameExp(input.next()) );
            if(is_punc(',')){
                skip_punc(',')
            }
        }

        return {
            type: "@import",
            params
        }
    }
    
    function parse_consecutive_str() { //to resolve test skew(20deg) rotate(20deg);

        function maybe_call(exp) {//to resolve rotate(30deg) or url("/images/mail.svg") this kind of inner call expression
            let expr = exp();

            if (is_punc('(')) {
                return {
                    type: expr.type,
                    value: expr.value + '(' + delimited('(', ')', ',', parse_expression).map(expr => expr.value).join(',') + ')'
                }
            }
            return expr;
        }

        function read_while(predicate) {
            let tokens = [];

            while (!input.eof() && predicate(input.peek()))
                tokens.push(maybe_call(() => input.next()));
            return tokens;
        }

        return {
            type: 'str',
            value: read_while(tok => tok.type === 'str').map(tok => tok.value).join(' ')
        }
    }

    function parse_key_var_wrapper(expr){
        skip_punc('{')
        let var_key = input.next();
        if(var_key.type!=="var"){
            input.croak(`${var_key} should be a variable which starts with '$'`)
        }
        skip_punc('}')
        return {
            type:'var_key',
            value:var_key.value
        };
    }

    function maybe_key_var_wrapper(exp){
        let expr = exp();

        if(is_punc('{')){
            return parse_key_var_wrapper()
        }

        expr.type = "str";

        return expr;
    }

    function parse_atom() {
        
        if (is_kw('@extend')) {
            input.next()
            return parse_extend();
        }

        if (is_kw('@mixin')) {
            input.next()
            return parse_mixin();
        }

        if (is_kw('@include')) {
            input.next()
            return parse_include();
        }

        if (is_kw('@import')) {
            input.next()
            return parse_import();
        }

        let tok = input.peek();
        if (tok.type === "var" || tok.type === "placeholder") {
            return input.next();
        }

        if (tok.type === "punc"){
            if(tok.value === "#"){
                return maybe_key_var_wrapper(()=>input.next())
            }
            return input.next()
        }

        if (tok.type === "str") {
            return parse_consecutive_str()
        }
    }

    function parse_expression() {
        return maybe_assign(function () {
            return parse_atom()
        })
    }

    function parse_prog(){
        var prog = [];
        while (!input.eof()) {
            let result = parse_expression()
            // console.log('result', JSON.stringify(result))
            prog.push(result);
            if (!input.eof()) skip_punc(";");
        }
        return {
            type: "prog", prog
        };
    }

    function parse_toplevel() {
        return parse_prog()
    }

    return parse_toplevel()
}

module.exports = parse;