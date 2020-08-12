import {
    defaultOnError,
    ErrorCodes,
    createCompilerError
} from './errors';

import {
    NodeTypes,
    locStub,
    RootNode,
    Statement,
    TextNode,
    SimpleExpressionNode,
    IfStatement,
    BodyStatement,
    ImportStatement,
    MixinStatement,
    IdentifierNode,
    VariableNode,
    AssignStatement,
    IncludeStatement,
    Position,
    OperatorNode,
    ChildStatement,
    ExtendStatement,
    BinaryNode,
    EachStatement,
    ListNode
} from './ast';

import {
    debug,
    PRECEDENCE,
    fillWhitespace,
} from './util'
import { ParserOptions } from '@/options';

/**
 * 
 * @param {lex processed stream method} input
 */

export default function parse(input, options:ParserOptions) {
    const { filename, source } = options;

    function emitError(
        code: ErrorCodes,
        offset?: number,
        loc: Position = input.getCoordination()
    ): void {
        if (offset) {
            loc.offset += offset
            loc.column += offset
        }
        defaultOnError(
            createCompilerError(code, {
                start: loc,
                end: loc,
                filename
            })
        )
    }

    function createListNode(list: SimpleExpressionNode[]):ListNode {
        return {
            type: NodeTypes.LIST,
            value: list,
            loc: {
                start: list[0].loc.start,
                end: list[list.length - 1].loc.end,
                filename: list[0].loc.filename
            }
        }
    }

    let assign_right_end_condition = default_right_end_condition;

    function injectLoc(parseFn) {
        return function (...args) {
            input.eliminateWhitespace()
            let start = input.getCoordination(),
                ast = parseFn.apply(null, args),
                end = input.getCoordination();

            /**
             * patch ASSIGN , make left node start as start position
             * patch BINARY node position, make binary left most node start as binary node start position
             * */

            if (ast.type === NodeTypes.BINARY || ast.type === NodeTypes.ASSIGN) {
                let left = args[0]
                while (left.type === NodeTypes.BINARY) {
                    left = left.left
                }
                start = left.loc.start;
            }

            return {
                ...ast,
                loc: {
                    start,
                    end,
                    filename
                }
            };
        }
    }

    let parserNamespace = {
        parse_assign: injectLoc(function parse_assign(left) {

            input.next();

            function parse_assign_right() {
                let right: SimpleExpressionNode[] = []
                while (!assign_right_end_condition()) {
                    if (debug()) break;
                    let result: SimpleExpressionNode = parserNamespace.maybe_binary(parserNamespace.parse_atom(), 0);
                    right.push(result)
                }
                return right;
            }


            let list: SimpleExpressionNode[] = parse_assign_right()

            return {
                type: NodeTypes.ASSIGN,
                left: left,
                right: createListNode(list)
            }
        }),

        parse_atom: injectLoc(function parse_atom() {

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
            if (tok.type === NodeTypes.VARIABLE || tok.type === NodeTypes.PLACEHOLDER) {
                return input.next();
            }

            if (tok.type === NodeTypes.PUNC) {
                if (tok.value === "#") {
                    return maybe_key_var_wrapper(() => input.next())
                }
                return input.next()
            }

            if (tok.type === NodeTypes.TEXT) {
                return parse_consecutive_str()
            }

            emitError(ErrorCodes.UNKNONWN_TOKEN_TYPE)
        }),

        maybe_call: injectLoc(function maybe_call(exp) { //to resolve rotate(30deg) or url("/images/mail.svg") this kind of inner call expression
            let expr = exp();

            if (is_punc('(')) {
                return {
                    type: expr.type,
                    value: expr.value + '(' + delimited('(', ')', ',', parse_expression).map(expr => expr.value).join(',') + ')'
                }
            }
            return expr;
        }),

        maybe_binary: injectLoc(function (left, left_prec) {
            let tok: OperatorNode = is_op()
            if (tok) {
                if (PRECEDENCE[tok.value] > left_prec) {
                    input.next(); //skip op
                    return parserNamespace.maybe_binary({
                        type: NodeTypes.BINARY,
                        operator: tok,
                        left: left,
                        right: parserNamespace.maybe_binary(parserNamespace.parse_atom(), PRECEDENCE[tok.value])
                    }, left_prec)
                }
            }
            return left;
        })

    }
    /**
     * end with ';' , eg:
     * 
     * $boder : 1px solid red;
     * 
     * end with ',' | ')' , eg:
     * 
     * @mixin test($param1:1,$param2:2){} // assign expression in @mixin or $include
      */

    function default_right_end_condition() {
        return is_punc(';')
    }

    function set_call_params_args_assign_right_end_condition() {
        assign_right_end_condition = () => is_punc(',') || is_punc(')');
    }

    function reset_assign_right_end_condition() {
        assign_right_end_condition = default_right_end_condition
    }

    function is_punc(ch) {
        let tok = input.peek();
        return tok && tok.type == NodeTypes.PUNC && (!ch || tok.value == ch) && tok;
    }

    function is_kw(kw) {
        let tok = input.peek();
        return tok && tok.type == NodeTypes.KEYWORD && (!kw || tok.value == kw) && tok;
    }

    function is_op(op?: OperatorNode): OperatorNode {
        let tok = input.peek();
        return tok && tok.type == NodeTypes.OPERATOR && (!op || tok.value == op) && tok;
    }

    function is_assign() {
        let tok = input.peek()
        return tok && tok.type === NodeTypes.ASSIGN;
    }

    function skip_punc(ch) {
        if (is_punc(ch)) input.next();
        // Todos: no mandatory skip for now
        // else {
        //     input.croak("Expecting punctuation: \"" + ch + "\"");
        // }
    }

    // todos: replace typescript any
    function delimited(start, stop, separator, parser: Function) {// FIFO
        let a: any[] = [], first = true;
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

    function parse_child(selector): ChildStatement {
        let children = delimited("{", "}", ";", parse_expression);
        // if (children.length == 0) return FALSE;
        // if (block.length == 1) return block[0];
        return {
            type: NodeTypes.CHILD,
            selector,
            children,
            loc: locStub
        };
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

        if (is_punc('#')) {
            return maybe_assign(() => {
                return createListNode(
                    expr.type === NodeTypes.LIST ?
                        expr.value.concat(parserNamespace.parse_atom())
                        : [expr].concat(parserNamespace.parse_atom()))
            })
        }

        if (is_punc('{')) {
            return parse_child(expr) //passin selector
        }

        return expr;
    }

    function parse_extend(): ExtendStatement {
        return {
            type: NodeTypes.EXTEND,
            param: input.next(),
            loc: locStub
        }
    }

    function parse_block_statement(): BodyStatement {
        let children: Statement[] = delimited("{", "}", ";", parse_expression);
        return {
            type: NodeTypes.BODY,
            children,
            loc: locStub
        };
    }

    /**
     * Todos: add @content kw and include body
     */
    function parse_mixin(): MixinStatement {
        let id: IdentifierNode = {
            type: NodeTypes.IDENTIFIER,
            value: input.next().value,
            loc: locStub
        },
            params: (VariableNode | AssignStatement)[] = [];


        if (!is_punc('{')) {
            /**
             * Support default params, which contains assign ':' symbol; which will be processed in parse_assign
             * @mixin replace-text($image,$x:default1, $y:default2) {
              */
            set_call_params_args_assign_right_end_condition()

            params = delimited('(', ')', ',', parse_expression);
        }

        reset_assign_right_end_condition()

        return {
            type: NodeTypes.MIXIN,
            id,
            params, // %extend like expr or func expr
            body: parse_block_statement(),
            loc: locStub
        }
    }

    function parse_include(): IncludeStatement {
        let id: IdentifierNode = {
            type: NodeTypes.IDENTIFIER,
            value: input.next().value,
            loc: locStub
        }, args: (VariableNode | AssignStatement)[] = [];// @include mixin1;

        if (!is_punc(';')) {
            set_call_params_args_assign_right_end_condition()
            args = delimited('(', ')', ',', parse_expression); // extend like expr or call expr
        }

        reset_assign_right_end_condition()

        return {
            type: NodeTypes.INCLUDE,
            id,
            args,
            loc: locStub
        }
    }

    function parse_import(): ImportStatement {

        function processFilenameExp(exp) {
            exp.value = exp.value.match(/^['"](.+)['"]$/)[1]
            return exp;
        }

        let delimitor = input.peek(),
            params: TextNode[] = [];

        if (!delimitor.value.startsWith("'") && !delimitor.value.startsWith('"')) {
            input.croak(`@import expected with ' or " but encountered ${delimitor}`)
        }

        while (!is_punc(';')) {  // @import 'foundation/code', 'foundation/lists';
            params.push(processFilenameExp(input.next()));
            if (is_punc(',')) {
                skip_punc(',')
            }
        }

        return {
            type: NodeTypes.IMPORT,
            params,
            loc: locStub
        }
    }

    function parse_if(): IfStatement {
        let alternate: IfStatement | BodyStatement | null = null,
            testExpression: BinaryNode | Boolean = true,
            blockStatement: BodyStatement;

        testExpression = parserNamespace.maybe_binary(parserNamespace.parse_atom(), 0);

        if (!is_punc('{')) {
            input.croak(`@if expect '{' but encountered '${input.next().value}'`)
        }

        blockStatement = parse_block_statement();

        if (is_kw('@else')) {
            input.next();
            let predictToken = input.peek();
            /**
             * check if it's a @else if  statement
              */
            if (predictToken.type === NodeTypes.TEXT && predictToken.value === 'if') {
                input.next();
                alternate = parse_if();
            } else {
                alternate = parse_block_statement()
            }
        }

        return {
            type: NodeTypes.IFSTATEMENT,
            test: testExpression,
            consequent: blockStatement,
            alternate: alternate,
            loc: locStub
        }
    }

    function parse_each(): EachStatement {
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
            type: NodeTypes.EACHSTATEMENT,
            left,
            right,
            body: blockStatement,
            loc: locStub
        }
    }


    function parse_error() {

        function parse_list(endCheck = () => !default_right_end_condition()) {
            let list: SimpleExpressionNode[] = []
            while (endCheck()) {
                list.push(parserNamespace.parse_atom())
            }
            return {
                type: NodeTypes.LIST,
                value: list
            }
        }

        return {
            type: NodeTypes.ERROR,
            value: parse_list()
        }
    }



    function parse_consecutive_str(): TextNode {

        function read_while(predicate): TextNode[] {
            let tokens: TextNode[] = [];

            while (!input.eof() && predicate(input.peek()))
                //to resolve test skew(20deg) rotate(20deg);
                tokens.push(parserNamespace.maybe_call(() => input.next()));
            return tokens;
        }

        let list: TextNode[] = read_while(tok => tok.type === NodeTypes.TEXT)

        return {
            type: NodeTypes.TEXT,
            value: fillWhitespace(list).map(tok => tok.value).join(''),
            loc: locStub // loc will be altered in injectLoc
        }
    }



    /**
     * 
     * #{var} 
     */

    function maybe_key_var_wrapper(exp) {

        function parse_key_var_wrapper() {
            skip_punc('{')
            let var_key = input.next();
            if (var_key.type !== NodeTypes.VARIABLE) {
                input.croak(`${var_key} should be a variable which starts with '$'`)
            }
            skip_punc('}')
            return {
                type: NodeTypes.VAR_KEY,
                value: var_key.value
            };
        }

        let expr = exp();

        if (is_punc('{')) {
            return parse_key_var_wrapper()
        }

        expr.type = NodeTypes.TEXT;

        /**
         * color: #1212; or #selector{}
          */
        let nextToken = parserNamespace.parse_atom();

        if (nextToken.type !== NodeTypes.TEXT) {
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

    function parse_prog(): RootNode {
        let children: Statement[] = [];
        while (!input.eof()) {
            let result = parse_expression()
            children.push(result);
            if (!input.eof()) skip_punc(";");
        }
        return {
            type: NodeTypes.RootNode,
            fileSourceMap: {
                [filename]: source
            },
            children,
            loc: locStub
        };
    }

    return parse_prog()
}