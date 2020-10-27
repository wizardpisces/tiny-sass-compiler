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
    DeclarationStatement,
    IncludeStatement,
    OperatorNode,
    RuleStatement,
    ExtendStatement,
    BinaryNode,
    EachStatement,
    ListNode,
    createListNode,
    createDeclarationStatement,
    VarKeyNode,
    puncType,
    FunctionStatement,
    createMixinStatement,
    createFunctionStatement,
    ReturnStatement,
    createReturnStatement,
    CallExpression,
    createIdentifierNode,
    createCallExpression,
    createRuleStatement,
    createIncludeStatement,
    createIfStatement,
    createEachStatement,
    createVarKeyExpression,
    createTextNode,
    createSelectorNode,
    createRootNode
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

    function defaultRightEndCondition() {
        return is_punc(';')
    }

    function set_call_params_args_assign_right_end_condition() {
        assignRightEndCondition = () => is_punc(',') || is_punc(')');
    }

    function reset_assign_right_end_condition() {
        assignRightEndCondition = defaultRightEndCondition
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
        return tok && tok.type === NodeTypes.DECLARATION;
    }

    function skipPunc(ch: any, silent: boolean = false) {
        if (is_punc(ch)) input.next();
        // mandatory skip
        else {
            !silent && input.emitError(ErrorCodes.EXPECTED_X, consumeNextTokenWithLoc().loc, ch)
        }
    }

    function skipPuncSilent(ch: any) {
        return skipPunc(ch, true)
    }

    // todos: replace typescript any
    function delimited(start: puncType, stop: puncType, separator: puncType, parser: Function) {// FIFO
        let statements: any[] = [], first = true;

        skipPunc(start);

        while (!input.eof()) {
            if (debug()) break;
            if (is_punc(stop)) break;
            if (first) {
                first = false;
            } else {
                if (separator === ';') {
                    skipPuncSilent(separator)
                } else {
                    skipPunc(separator);
                }
            }
            if (is_punc(stop)) break;

            statements.push(parser());
        }
        skipPunc(stop);
        return statements;
    }

    let assignRightEndCondition = defaultRightEndCondition;

    // type parseFunctionType = <T extends Node>(...args:any[]) => T

    function injectLoc(parseFn) {
        return function injectLocInner(...args) {
            input.eliminateWhitespace()
            let start = input.getCoordination(),
                ast = parseFn.apply(null, args),
                end = input.getCoordination();

            /**
             * patch DECLARATION , make left node start as start position
             * patch BINARY node position, make binary left most node start as binary node start position
             * */

            if (ast.type === NodeTypes.BINARY || ast.type === NodeTypes.DECLARATION) {
                let left = args[0]
                if (left) {
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
    const consumeNextTokenWithLoc = injectLoc(() => input.next())

    const parseError = injectLoc(function parseError() {

        function parse_list(endCheck = () => !defaultRightEndCondition()) {
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

    /**
     * divide dispatchParser 
     * by scan_right ( deal with right only expression which may contain call expression) 
     * and default (deal with left only expression which maybe a consecutive textNode as assign left type)
     * 
     */

    function dispatchParserWithScanRight() {
        return dispatchParser('scan_right')
    }

    function dispatchParser(scanType: 'scan_right' | '' = '') {

        if (is_kw('@extend')) {
            input.next()
            return parseExtend();
        }

        if (is_kw('@mixin')) {
            input.next()
            return parseMixin();
        }

        if (is_kw('@function')) {
            input.next()
            return parseFunction();
        }

        if (is_kw('@return')) {
            input.next()
            return parseReturn();
        }

        if (is_kw('@include')) {
            input.next()
            return parseInclude();
        }

        if (is_kw('@import')) {
            input.next()
            return parseImport();
        }

        if (is_kw('@if')) {
            input.next()
            return parseIf();
        }

        if (is_kw('@each')) {
            input.next()
            return parseEach();
        }

        if (is_kw('@error')) {
            input.next()
            return parseError();
        }

        let tok = input.peek();

        if (tok.type === NodeTypes.VARIABLE || tok.type === NodeTypes.PLACEHOLDER) {
            return consumeNextTokenWithLoc();
        }

        if (tok.type === NodeTypes.PUNC) {
            if (tok.value === "#") {
                return maybeVarKeyWrapper()
            }
            return consumeNextTokenWithLoc()
        }

        if (tok.type === NodeTypes.TEXT) {

            if (scanType === 'scan_right') {
                return maybeCall(consumeNextTokenWithLoc())
            } else {
                /**
                 * only parse expression left side, which won't contain callExpression
                 * eg:
                 * body .main{}
                 */
                return parseConsecutiveLeft()
            }
        }

        /**
         * cases like internal keyword 
         * @media only screen and (max-width: $maxwidth){}
         * etc, should not throw error but parsed as special callExpression
         */
        if (tok.type == NodeTypes.KEYWORD) {
            if (is_kw('@media')) {
                input.next()
                return parseMedia();
            }
            return input.emitError(ErrorCodes.UNKNOWN_KEYWORD, consumeNextTokenWithLoc().loc, tok.value)
        }

        return input.emitError(ErrorCodes.UNKNONWN_TOKEN_TYPE, consumeNextTokenWithLoc().loc, tok.type)
    }

    function parseMedia() {

    }

    function parseSimpleExpressionList(): SimpleExpressionNode[] {
        let right: SimpleExpressionNode[] = [];
        while (!assignRightEndCondition()) {
            if (debug()) break;
            /**
             * catch error when missed ';', but encountered ':'
             */
            if (is_assign() || is_punc('{')) {
                let tok = consumeNextTokenWithLoc()
                input.emitError(ErrorCodes.EXPECTED_X, tok.loc, ";")
            }

            let result: SimpleExpressionNode = maybeBinaryNode(dispatchParserWithScanRight(), 0);
            right.push(result)
        }
        return right;
    }

    function parseAssign(left: DeclarationStatement['left']): DeclarationStatement {

        input.next(); // skip ':' which is not punc type ,so could not use skipPunc

        let right: ListNode = createListNode(parseSimpleExpressionList())

        return createDeclarationStatement(left, right)
    }

    function maybeBinaryNode(left: TextNode | BinaryNode, left_prec): TextNode | BinaryNode {
        let tok: OperatorNode = is_op()
        if (tok) {
            if (PRECEDENCE[tok.value] > left_prec) {
                tok = consumeNextTokenWithLoc(); //skip op , add loc
                let nextNode: TextNode = consumeNextTokenWithLoc();

                if (nextNode.type !== NodeTypes.TEXT && nextNode.type !== NodeTypes.VARIABLE) {
                    input.emitError(ErrorCodes.EXPECT_TEXT_NODE_AFTER_OPERATOR_NODE, nextNode.loc)
                }

                return maybeBinaryNode({
                    type: NodeTypes.BINARY,
                    operator: tok,
                    left: left,
                    right: maybeBinaryNode(nextNode, PRECEDENCE[tok.value]),
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

    function parseCHILD(selector: RuleStatement['selector']): RuleStatement {
        let children = delimited("{", "}", ";", parseStatement);
        return createRuleStatement(selector, children)
    }

    function maybeAssign(exp) {
        let expr = exp();

        if (is_assign()) {
            return parseAssign(expr)
        }

        /**
         * handle selector may contain key_var, which should be resolved to list ast
         * .icon-#{$size} {}
        */

        if (is_punc('#')) {
            return maybeAssign(() => {
                return createListNode(
                    expr.type === NodeTypes.LIST ?
                        expr.value.concat(dispatchParser())
                        : [expr].concat(dispatchParser()))
            })
        }

        if (is_punc('{')) {
            return parseCHILD(createSelectorNode(expr)) //passin selector
        }

        return expr;
    }

    function parseExtend(): ExtendStatement {
        return {
            type: NodeTypes.EXTEND,
            param: consumeNextTokenWithLoc(),
            loc: locStub
        }
    }

    function parseBody(): BodyStatement {
        let children: Statement[] = delimited("{", "}", ";", parseStatement);
        return {
            type: NodeTypes.BODY,
            children,
            loc: locStub
        };
    }

    /**
     * Todos: add @content kw and include body
     */
    function parseMixin(): MixinStatement {
        let id: IdentifierNode = {
            type: NodeTypes.IDENTIFIER,
            value: input.next().value,
            loc: locStub
        },
            params: (VariableNode | DeclarationStatement)[] = [];


        if (!is_punc('{')) {
            /**
             * Support default params, which contains assign ':' symbol; which will be processed in parseAssign
             * @mixin replace-text($image,$x:default1, $y:default2) {
              */
            set_call_params_args_assign_right_end_condition()

            params = delimited('(', ')', ',', parseStatement);
        }

        reset_assign_right_end_condition()

        return createMixinStatement(id, params, parseBody());
    }

    function parseFunction(): FunctionStatement {
        let id: IdentifierNode = {
            type: NodeTypes.IDENTIFIER,
            value: input.next().value,
            loc: locStub
        },
            params: (VariableNode | DeclarationStatement)[] = [];


        if (!is_punc('{')) {
            /**
             * Support default params, which contains assign ':' symbol; which will be processed in parseAssign
             * @functoin replace-text($image,$x:default1, $y:default2) {
              */
            set_call_params_args_assign_right_end_condition()

            params = delimited('(', ')', ',', parseStatement);
        }

        reset_assign_right_end_condition()

        return createFunctionStatement(id, params, parseBody());
    }

    function parseReturn(): ReturnStatement {
        return createReturnStatement(parseSimpleExpressionList())
    }


    /** to resolve rotate(30deg) or url("/images/mail.svg") @media (min-width: 768px) {}  kind of inner call expression
     * also custom @function call
     */
    function maybeCall(node: TextNode): TextNode | CallExpression {

        if (is_punc('(')) {
            set_call_params_args_assign_right_end_condition()
            let callExpression = createCallExpression(createIdentifierNode(node), delimited('(', ')', ',', parseStatement))
            reset_assign_right_end_condition()
            return callExpression
        }
        return node;
    }

    function parseInclude(): IncludeStatement {
        let id: IdentifierNode = {
            type: NodeTypes.IDENTIFIER,
            value: input.next().value,
            loc: locStub
        }, args: (VariableNode | DeclarationStatement)[] = [];// @include mixin1;

        if (!is_punc(';')) {
            set_call_params_args_assign_right_end_condition()
            /**
             * use maybeAssign to wrap to deal with possible default include args 
             * eg:
             * @include avatar(100px, $circle: false);
             */
            args = delimited('(', ')', ',', () => maybeAssign(dispatchParserWithScanRight)); // extend like expr or call expr
        }

        reset_assign_right_end_condition()

        return createIncludeStatement(id, args);
    }

    function parseImport(): ImportStatement {

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
                skipPunc(',')
            }
        }

        return {
            type: NodeTypes.IMPORT,
            params,
            loc: locStub
        }
    }

    function parseIf(): IfStatement {
        let alternate: IfStatement | BodyStatement | null = null,
            testExpression: BinaryNode | TextNode,
            blockStatement: BodyStatement;

        testExpression = maybeBinaryNode(dispatchParser(), 0);

        blockStatement = parseBody();

        if (is_kw('@else')) {
            input.next();
            let predictToken = input.peek();
            /**
             * check if it's a @else if  statement
              */
            if (predictToken.type === NodeTypes.TEXT && predictToken.value === 'if') {
                input.next();
                alternate = parseIf();
            } else {
                alternate = parseBody()
            }
        }

        return createIfStatement(testExpression, blockStatement, alternate)
    }

    function parseEach(): EachStatement {
        let left = dispatchParser();

        /**
         * skip "in" expression
          */

        input.next();

        let right = dispatchParser();

        skipPunc('{')
        let blockStatement = parseStatement()
        skipPunc('}')
        return createEachStatement(left, right, blockStatement)
    }

    function parseConsecutiveLeft(): TextNode {


        function read_while(predicate): TextNode[] {
            let tokens: TextNode[] = [];

            while (!input.eof() && predicate(input.peek()))
                //to resolve test skew(20deg) rotate(20deg);
                tokens.push(consumeNextTokenWithLoc());
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

    function maybeVarKeyWrapper(): VarKeyNode | TextNode {
        function parse_key_var_wrapper(varKeyStartLoc): VarKeyNode {
            skipPunc('{')
            let node = consumeNextTokenWithLoc();
            if (node.type !== NodeTypes.VARIABLE) {
                input.croak(`${node} should be a variable which starts with '$'`)
            }
            skipPunc('}')
            return createVarKeyExpression(node.value, {
                start: varKeyStartLoc,
                end: node.loc.end,
                filename
            })
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
            input.croak(`[maybeVarKeyWrapper]: expect str token but received ${nextToken.value}`)
        }

        return createTextNode('#' + nextToken.value, {
            start: token.start,
            end: nextToken.end,
            filename
        })
    }

    function parseStatement() {
        return maybeAssign(function () {
            return dispatchParser()
        })
    }

    function isEnd() {
        return input.eof()
    }

    function parsechildren(): Statement[] {
        let children: Statement[] = [];
        while (!isEnd()) {
            children.push(parseStatement());
            skipPuncSilent(";");
        }
        return children
    }

    function parseProgram(): RootNode {
        return createRootNode(parsechildren(), { [filename]: source })
    }

    return parseProgram()
}