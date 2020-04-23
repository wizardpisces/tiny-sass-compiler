
let {
    debug,
    PRECEDENCE,
    fillWhitespace
} = require('./util')

/**
 * 
 * @param {lex processed stream method} input
 */

function parse(input) {

    let assign_right_end_condition = default_right_end_condition;

    function injectPositionToParser(parserNamespace){
        function injectPosition(fnKey) {
            let originalFn = parserNamespace[fnKey]
            parserNamespace[fnKey] = function(){
                let args = Array.prototype.slice.call(arguments);
                input.eliminateWhitespace()
                let start = input.getCoordination().pos,
                    ast = originalFn.apply(null, args),
                    end = input.getCoordination().pos;

                /**
                 * adjust start position
                 * if arguments exist it might be an evaluated expression eg: parse_assign left param
                 */
                if(args && args.length > 0){
                    if(typeof args[0].start === undefined){
                        input.croak(`[${fnKey}]: expect expression with start property!`)
                    }
                     start = start > args[0].start ? args[0].start : start;
                }

                return {
                    start,
                    end,
                    ...ast
                };
            }
        }
    
        Object.keys(parserNamespace).forEach(fnKey => {
            injectPosition(fnKey)
        })
    }

    let parserNamespace = {
        parse_assign: function(left){

             input.next();

             function parse_assign_right() {
                 let right = []
                 while (!assign_right_end_condition()) {
                     if (debug()) break;
                     let result = maybe_binary(parserNamespace.parse_atom(), 0);
                     right.push(result)
                 }
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
        },

        parse_atom: function(){

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

            if (is_kw('@if')) {
                input.next()
                return parse_if();
            }

            if (is_kw('@each')) {
                input.next()
                return parse_each();
            }

            if (is_kw('@error')) {
                input.next()
                return parse_error();
            }

            let tok = input.peek();
            if (tok.type === "var" || tok.type === "placeholder") {
                return input.next();
            }

            if (tok.type === "punc") {
                if (tok.value === "#") {
                    return maybe_key_var_wrapper(() => input.next())
                }
                return input.next()
            }

            if (tok.type === "str") {
                return parse_consecutive_str()
            }
        },

        maybe_call: function(exp) { //to resolve rotate(30deg) or url("/images/mail.svg") this kind of inner call expression
            let expr = exp();

            if (is_punc('(')) {
                return {
                    type: expr.type,
                    value: expr.value + '(' + delimited('(', ')', ',', parse_expression).map(expr => expr.value).join(',') + ')'
                }
            }
            return expr;
        }

    }

    injectPositionToParser(parserNamespace);
/**
 * end with ';' , eg:
 * 
 * $boder : 1px solid red;
 * 
 * end with ',' | ')' , eg:
 * 
 * @mixin test($param1:1,$param2:2){} // assign expression in @mixin or $include
  */

    function default_right_end_condition(){
        return is_punc(';')
    }

    function set_call_params_args_assign_right_end_condition(){
        assign_right_end_condition = () => is_punc(',') || is_punc(')');
    }

    function reset_assign_right_end_condition(){
        assign_right_end_condition = default_right_end_condition
    }

    function is_punc(ch) {
        let tok = input.peek();
        return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
    }

    function is_kw(kw) {
        let tok = input.peek();
        return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
    }

    function is_op(op) {
        let tok = input.peek();
        return tok && tok.type == "op" && (!op || tok.value == op) && tok;
    }

    function is_assign() {
        let tok = input.peek()
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
        let a = [], first = true;
        skip_punc(start);

        while (!input.eof()) {
            if (debug()) break;
            if (is_punc(stop)) break;
            if (first) first = false; else skip_punc(separator);
            if (is_punc(stop)) break;

            a.push(parser());
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
                    right: maybe_binary(parserNamespace.parse_atom(), PRECEDENCE[tok.value])
                }, left_prec)
            }
        }
        return left;
    }

    function parse_child(selector) {
        let children = delimited("{", "}", ";", parse_expression);
        // if (children.length == 0) return FALSE;
        // if (block.length == 1) return block[0];
        return { type: "child", selector, children };
    }

    function maybe_assign(exp) {
        let expr = exp();

        if (is_assign()) {
            return parserNamespace.parse_assign(expr)
        }

        /**
         * handle selector may contain key_var, which should be resolved to list ast
         * .icon-#{$size} {}
        */

        if(is_punc('#')){
            return maybe_assign(()=>{
                return {
                    type:'list',
                    value: expr.type === 'list' ? expr.value.concat(parserNamespace.parse_atom()) : [expr].concat(parserNamespace.parse_atom())
                }
            })
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

    function parse_block_statement() {
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
            set_call_params_args_assign_right_end_condition()

            params = delimited('(', ')', ',', parse_expression);
        }

        reset_assign_right_end_condition()

        return {
            type: "@mixin",
            id,
            params, // %extend like expr or func expr
            body: parse_block_statement()
        }
    }

    function parse_include() {
        let id = {
            type: "identifier",
            name: input.next().value
        },
        args = [];// @include mixin1;

        if(!is_punc(';')){ 
            set_call_params_args_assign_right_end_condition()
            args = delimited('(', ')', ',', parse_expression); // extend like expr or call expr
        }

        reset_assign_right_end_condition()

        return {
            type: "@include",
            id,
            args,
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

    function parse_if(){
        let alternate = null,
            testExpression = true,
            blockStatement = [];

        testExpression = maybe_binary(parserNamespace.parse_atom(),0);

        if (!is_punc('{')){
            input.croak(`@if expect '{' but encountered '${input.next().value}'`)            
        }

        blockStatement = parse_block_statement();

        if (is_kw('@else')){
            input.next();
            let predictToken = input.peek();
            /**
             * check if it's a @else if  statement
              */
            if (predictToken.type === 'str' && predictToken.value === 'if'){
                input.next();
                alternate = parse_if();
            }else{
                alternate = parse_block_statement()
            }
        }

        return { type: "IfStatement", test: testExpression, consequent: blockStatement, alternate: alternate }
    }

    function parse_each(){
        let left = parserNamespace.parse_atom();

        /**
         * skip "in" expression
          */

        input.next();

        let right = parserNamespace.parse_atom();

        skip_punc('{')
        let blockStatement = parse_expression()
        skip_punc('}')
        return {
            type: "EachStatement",
            left,
            right,
            body: blockStatement
        }
    }

    function parse_list(endCheck = () => !default_right_end_condition()) {
        let list = []
        while (endCheck()) {
            list.push(parserNamespace.parse_atom())
        }
        return {
            type:'list',
            value: list
        }
    }

    function parse_error(){
        return {
            type:"@error",
            value: parse_list()
        }
    }
    
    

    function parse_consecutive_str() { //to resolve test skew(20deg) rotate(20deg);


        function read_while(predicate) {
            let tokens = [];

            while (!input.eof() && predicate(input.peek()))
                tokens.push(parserNamespace.maybe_call(() => input.next()));
            return tokens;
        }

        let tokens = read_while(tok => tok.type === 'str')

        return {
            type: 'str',
            value: fillWhitespace(tokens).map(tok => tok.value).join('')
        }
    }

    function parse_key_var_wrapper(){
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

    /**
     * 
     * #{var} 
     */

    function maybe_key_var_wrapper(exp){
        let expr = exp();

        if(is_punc('{')){
            return parse_key_var_wrapper()
        }

        expr.type = "str";

        /**
         * color: #1212; or #selector{}
          */
        let nextToken = parserNamespace.parse_atom();

        if(nextToken.type!=='str'){
            input.croak(`[maybe_key_var_wrapper]: expect str token but received ${nextToken.value}`)
        }

        expr.value = expr.value + nextToken.value;

        return expr;
    }

    function parse_expression() {
        return maybe_assign(function () {
            return parserNamespace.parse_atom()
        })
    }

    function parse_prog(){
        let prog = [];
        while (!input.eof()) {
            let result = parse_expression()
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