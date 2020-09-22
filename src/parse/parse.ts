import {
    ErrorCodes,
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
    OperatorNode,
    ChildStatement,
    ExtendStatement,
    BinaryNode,
    EachStatement,
    ListNode,
    createListNode,
    createAssignStatement,
    VarKeyNode,
    puncType
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

export default function parse(input, options: ParserOptions) {
    const { filename, source } = options;
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

    function is_punc(ch?: puncType) {
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
        // mandatory skip
        else {
            input.emitError(ErrorCodes.EXPECTED_X, consumeNextTokenWithLoc().loc, ch)
        }
    }

    // todos: replace typescript any
    function delimited(start: puncType, stop: puncType, separator: puncType, parser: Function) {// FIFO
        let statements: any[] = [], first = true;

        skip_punc(start);

        while (!input.eof()) {
            if (debug()) break;
            if (is_punc(stop)) break;
            if (first) {
                first = false;
            } else {
                skip_punc(separator);
            }
            if (is_punc(stop)) break;

            statements.push(parser());
        }
        skip_punc(stop);
        return statements;
    }

    let assign_right_end_condition = default_right_end_condition;

    // type parseFunctionType = <T extends Node>(...args:any[]) => T

    function injectLoc(parseFn) {
        return function injectLocInner(...args) {
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
                if(left){
                    while (left.type === NodeTypes.BINARY) {
                        left = left.left
                    }
                    start = left.loc.start;
                }
            }

            let loc = {
                start,
                end,
                filename
            }

            if (start.offset >= end.offset) {
                input.emitError(ErrorCodes.INVALID_LOC_POSITION)
            }

            return {
                ...ast,
                loc,
            };
        }
    }

    const parse_error = injectLoc(function parse_error() {

        function parse_list(endCheck = () => !default_right_end_condition()) {
            let list: SimpleExpressionNode[] = []
            while (endCheck()) {
                list.push(dispatchParser())
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
    })

    const consumeNextTokenWithLoc = injectLoc(() => input.next())

    function dispatchParser() {

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
            return consumeNextTokenWithLoc();
        }

        if (tok.type === NodeTypes.PUNC) {
            if (tok.value === "#") {
                return maybe_key_var_wrapper()
            }
            return consumeNextTokenWithLoc()
        }

        if (tok.type === NodeTypes.TEXT) {
            return parse_consecutive_str()
        }

        // error handling

        if (tok.type == NodeTypes.KEYWORD) {
            return input.emitError(ErrorCodes.UNKNOWN_KEYWORD, consumeNextTokenWithLoc().loc, tok.value)
        }

        return input.emitError(ErrorCodes.UNKNONWN_TOKEN_TYPE, consumeNextTokenWithLoc().loc, tok.type)
    }

    function parseAssign(left: AssignStatement['left']): AssignStatement {

        input.next();

        function parse_assign_right(): SimpleExpressionNode[] {
            let right: SimpleExpressionNode[] = [];
            while (!assign_right_end_condition()) {
                if (debug()) break;
                /**
                 * catch error when missed ';', but encountered ':'
                 */
                if (is_assign() || is_punc('{')) {
                    let tok = consumeNextTokenWithLoc()
                    input.emitError(ErrorCodes.EXPECTED_X, tok.loc, ";")
                }

                let result: SimpleExpressionNode = maybe_binary(dispatchParser(), 0);
                right.push(result)
            }
            return right;
        }

        let right: ListNode = createListNode(parse_assign_right())

        return createAssignStatement(left, right)
    }

    function maybe_binary(left: TextNode | BinaryNode, left_prec): TextNode | BinaryNode {
        let tok: OperatorNode = is_op()
        if (tok) {
            if (PRECEDENCE[tok.value] > left_prec) {
                tok = consumeNextTokenWithLoc(); //skip op , add loc
                let nextNode: TextNode = consumeNextTokenWithLoc();

                if (nextNode.type !== NodeTypes.TEXT) {
                    input.emitError(ErrorCodes.EXPECT_TEXT_NODE_AFTER_OPERATOR_NODE, nextNode.loc)
                }

                return maybe_binary({
                    type: NodeTypes.BINARY,
                    operator: tok,
                    left: left,
                    right: maybe_binary(nextNode, PRECEDENCE[tok.value]),
                    loc: {
                        start: left.loc.start,
                        end: nextNode.loc.end,
                        filename
                    }
                }, left_prec)
            }
        }
        return left;
    }

    function parse_child(selector: ChildStatement['selector']): ChildStatement {
        let children = delimited("{", "}", ";", parse_statement);

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
            return parseAssign(expr)
        }

        /**
         * handle selector may contain key_var, which should be resolved to list ast
         * .icon-#{$size} {}
        */

        if (is_punc('#')) {
            return maybe_assign(() => {
                return createListNode(
                    expr.type === NodeTypes.LIST ?
                        expr.value.concat(dispatchParser())
                        : [expr].concat(dispatchParser()))
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
            param: consumeNextTokenWithLoc(),
            loc: locStub
        }
    }

    function parse_block_statement(): BodyStatement {
        let children: Statement[] = delimited("{", "}", ";", parse_statement);
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
             * Support default params, which contains assign ':' symbol; which will be processed in parseAssign
             * @mixin replace-text($image,$x:default1, $y:default2) {
              */
            set_call_params_args_assign_right_end_condition()

            params = delimited('(', ')', ',', parse_statement);
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
            args = delimited('(', ')', ',', parse_statement); // extend like expr or call expr
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
            params.push(processFilenameExp(consumeNextTokenWithLoc()));
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
            testExpression: BinaryNode | TextNode,
            blockStatement: BodyStatement;

        testExpression = maybe_binary(dispatchParser(), 0);

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
        let left = dispatchParser();

        /**
         * skip "in" expression
          */

        input.next();

        let right = dispatchParser();

        skip_punc('{')
        let blockStatement = parse_statement()
        skip_punc('}')
        return {
            type: NodeTypes.EACHSTATEMENT,
            left,
            right,
            body: blockStatement,
            loc: locStub
        }
    }

    function parse_consecutive_str(): TextNode {

        function maybe_call(exp: Function): TextNode { //to resolve rotate(30deg) or url("/images/mail.svg") this kind of inner call expression
            let expr = exp();

            if (is_punc('(')) {
                return {
                    ...expr,
                    type: NodeTypes.TEXT,
                    value: expr.value + '(' + delimited('(', ')', ',', parse_statement).map(expr => expr.value).join(',') + ')'
                }
            }

            return expr;
        }

        function read_while(predicate): TextNode[] {
            let tokens: TextNode[] = [];

            while (!input.eof() && predicate(input.peek()))
                //to resolve test skew(20deg) rotate(20deg);
                tokens.push(maybe_call(consumeNextTokenWithLoc));
            return tokens;
        }

        let list: TextNode[] = read_while(tok => tok.type === NodeTypes.TEXT),

            listNode: ListNode = createListNode(list);

        // no nested ListNode for now, so we flatten and return TextNode
        return {
            type: NodeTypes.TEXT,
            value: fillWhitespace(list).map(tok => tok.value).join(''),
            loc: listNode.loc
        }
    }



    /**
     * 
     * #{var} 
     */

    function maybe_key_var_wrapper(): VarKeyNode | TextNode {
        function parse_key_var_wrapper(varKeyStartLoc): VarKeyNode {
            skip_punc('{')
            let node = consumeNextTokenWithLoc();
            if (node.type !== NodeTypes.VARIABLE) {
                input.croak(`${node} should be a variable which starts with '$'`)
            }
            skip_punc('}')
            return {
                ...node,
                type: NodeTypes.VAR_KEY,
                loc: {
                    start: varKeyStartLoc,
                    end: node.loc.end,
                    filename
                }
            };
        }

        let token = consumeNextTokenWithLoc();

        if (is_punc('{')) {
            return parse_key_var_wrapper(token.loc.start)
        }

        /**
         * color: #1212; or #selector{}
          */
        let nextToken = consumeNextTokenWithLoc();

        if (nextToken.type !== NodeTypes.TEXT) {
            input.croak(`[maybe_key_var_wrapper]: expect str token but received ${nextToken.value}`)
        }

        return {
            type: NodeTypes.TEXT,
            value: '#' + nextToken.value,
            loc: {
                start: token.start,
                end: nextToken.end,
                filename
            }
        };
    }

    function parse_statement() {
        return maybe_assign(function () {
            return dispatchParser()
        })
    }

    function parse_prog(): RootNode {
        let children: Statement[] = [];
        while (!input.eof()) {
            let result = parse_statement()
            children.push(result);
            if (is_punc(";")) skip_punc(";");
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