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
    createRootNode,
    MediaStatement,
    createMediaFeature,
    MediaQuery,
    MediaPrelude,
    createMediaStatement,
    createMediaPrelude,
    createMediaQuery,
    createBodyStatement,
    createKeyframes,
    Keyframes,
    createKeyframesPrelude,
    ContentPlaceholder,
    createContentPlaceholder
} from './ast';

import {
    debug,
    PRECEDENCE,
    fillWhitespace,
    isKeyframesName,
    range,
} from './util'
import { ParserOptions } from '@/type';
import { LexicalStream, Token } from './lexical';

/**
 * 
 * @param {lex processed stream method} input
 */

export default function parse(input: LexicalStream, options: ParserOptions) {
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
        return isPuncToken(';')
    }

    function set_call_params_args_assign_right_end_condition() {
        assignRightEndCondition = () => isPuncToken(',') || isPuncToken(')');
    }

    function reset_assign_right_end_condition() {
        assignRightEndCondition = defaultRightEndCondition
    }

    function isPuncToken(ch?: puncType) {
        let tok = input.peek();
        return tok && tok.type == NodeTypes.PUNC && (!ch || tok.value == ch) && tok;
    }

    function isKwToken(kw: string): Token | boolean {
        let tok = input.peek();
        return tok && tok.type == NodeTypes.KEYWORD && (!kw || tok.value == kw) && tok;
    }

    function isKeyFramesToken() {
        let tok = input.peek()
        return tok && tok.type == NodeTypes.KEYWORD && isKeyframesName('keyframes');
    }

    function isOpToken(op?: string): OperatorNode | boolean {
        let tok = input.peek();
        if (tok && tok.type == NodeTypes.OPERATOR && (!op || tok.value == op)) {
            return tok as OperatorNode
        }
        return false
    }

    function isAssignToken(): boolean {
        let tok = input.peek()
        return tok && tok.type === NodeTypes.DECLARATION;
    }

    function skipPunc(ch: any, silent: boolean = false) {
        if (isPuncToken(ch)) input.next();
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
            if (isPuncToken(stop)) break;
            if (first) {
                first = false;
            } else {
                if (separator === ';') {
                    skipPuncSilent(separator) // prevent nested block from emit error
                } else {
                    skipPunc(separator);
                }
            }
            if (isPuncToken(stop)) break;

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

        if (isKwToken('@extend')) {
            input.next()
            return parseExtend();
        }

        if (isKwToken('@mixin')) {
            input.next()
            return parseMixin();
        }

        if (isKwToken('@content')) {
            let tok = consumeNextTokenWithLoc()
            return parseContent(tok.loc);
        }

        if (isKwToken('@function')) {
            input.next()
            return parseFunction();
        }

        if (isKwToken('@return')) {
            input.next()
            return parseReturn();
        }

        if (isKwToken('@include')) {
            input.next()
            return parseInclude();
        }

        if (isKwToken('@import')) {
            input.next()
            return parseImport();
        }

        if (isKwToken('@if')) {
            input.next()
            return parseIf();
        }

        if (isKwToken('@each')) {
            input.next()
            return parseEach();
        }

        if (isKwToken('@error')) {
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
            if (isKwToken('@media')) {
                input.next()
                return parseMedia();
            }
            /**
             * @-webkit-keyframes
             * @-moz-keyframes
             * @-o-keyframes
             * @keyframes
             */
            if (isKeyFramesToken()) {
                let kf = input.next()
                return parseKeyframes(kf.value)
            }

            return input.emitError(ErrorCodes.UNKNOWN_KEYWORD, consumeNextTokenWithLoc().loc, tok.value)
        }

        return input.emitError(ErrorCodes.UNKNONWN_TOKEN_TYPE, consumeNextTokenWithLoc().loc, tok.type)
    }

    function parseKeyframes(keyframesName: string): Keyframes {
        let children: Keyframes['prelude']['children'] = [];

        while (!isPuncToken('{')) {
            children.push(dispatchParser())
        }

        let bodyStatement: BodyStatement = parseBody()

        return createKeyframes(keyframesName, createKeyframesPrelude(children), bodyStatement)
    }

    function parseMedia(): MediaStatement {
        let mediaQueryListChildren: MediaPrelude['children'] = [],
            mediaQueryChildren: MediaQuery['children'] = [];

        set_call_params_args_assign_right_end_condition()
        while (!isPuncToken('{')) {
            if (isPuncToken(',')) {
                // reset mediaQueryChildren
                mediaQueryListChildren.push(createMediaQuery(mediaQueryChildren))
                mediaQueryChildren = []
                skipPunc(',')
            } else if (isPuncToken('(')) {
                skipPunc('(')
                let left: DeclarationStatement['left'] = consumeNextTokenWithLoc(),
                    declaration = parseDeclaration(left)

                mediaQueryChildren.push(createMediaFeature(declaration))
                skipPunc(')')
            } else {
                mediaQueryChildren.push(consumeNextTokenWithLoc()) // eg: and,screen etc like TEXT
            }
        }
        reset_assign_right_end_condition()
        // flush array
        if (mediaQueryChildren.length) {
            mediaQueryListChildren.push(createMediaQuery(mediaQueryChildren))
            mediaQueryChildren = []
        }

        let bodyStatement: BodyStatement = parseBody()

        return createMediaStatement(createMediaPrelude(mediaQueryListChildren), bodyStatement)
    }

    function parseSimpleExpressionList(): SimpleExpressionNode[] {
        let right: SimpleExpressionNode[] = [];
        while (!assignRightEndCondition()) {
            if (debug()) break;
            /**
             * catch error when missed ';', but encountered ':'
             */
            if (isAssignToken() || isPuncToken('{')) {
                let tok = consumeNextTokenWithLoc()
                input.emitError(ErrorCodes.EXPECTED_X, tok.loc, ";")
            }

            let result: SimpleExpressionNode = maybeBinaryNode(dispatchParserWithScanRight(), 0);
            right.push(result)
        }
        return right;
    }

    function parseDeclaration(left: DeclarationStatement['left']): DeclarationStatement {

        input.next(); // skip ':' which is not punc type ,so could not use skipPunc

        let right: ListNode = createListNode(parseSimpleExpressionList())

        return createDeclarationStatement(left, right)
    }

    function maybeBinaryNode(left: TextNode | BinaryNode, left_prec): TextNode | BinaryNode {
        if (isOpToken()) {
            let tok: OperatorNode = isOpToken() as OperatorNode;
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

    function parseRule(selector: RuleStatement['selector']): RuleStatement {
        let children = delimited("{", "}", ";", parseStatement);
        return createRuleStatement(selector, children)
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
        return createBodyStatement(children)
    }

    function parseContent(loc: ContentPlaceholder['loc']): ContentPlaceholder {
        return createContentPlaceholder(loc)
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


        if (!isPuncToken('{')) {
            /**
             * Support default params, which contains assign ':' symbol; which will be processed in parseDeclaration
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


        if (!isPuncToken('{')) {
            /**
             * Support default params, which contains assign ':' symbol; which will be processed in parseDeclaration
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


    /** to resolve rotate(30deg) or url("/images/mail.svg")  kind of inner call expression
     * also custom @function call
     */
    function maybeCall(node: TextNode): TextNode | CallExpression {

        if (isPuncToken('(')) {
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
        },
            args: (VariableNode | DeclarationStatement)[] = [],
            content: IncludeStatement['content'];// @include mixin1;

        if (!isPuncToken(';')) {
            set_call_params_args_assign_right_end_condition()
            /**
             * use maybeDeclaration to wrap to deal with possible default include args 
             * eg:
             * @include avatar(100px, $circle: false);
             */
            args = delimited('(', ')', ',', () => maybeDeclaration(dispatchParserWithScanRight)); // extend like expr or call expr
        }

        reset_assign_right_end_condition()

        if (isPuncToken('{')) {
            content = parseBody()
        }

        return createIncludeStatement(id, args, content);
    }

    function parseImport(): ImportStatement {

        function processFilenameExp(exp) {
            exp.value = exp.value.match(/^['"](.+)['"]$/)[1]
            return exp;
        }

        let delimitor = input.peek(),
            params: TextNode[] = [];

        if (!delimitor.value.startsWith("'") && !delimitor.value.startsWith('"')) {
            input.emitError(ErrorCodes.EXPECTED_X, locStub, `@import expected with ' or " but encountered ${delimitor}`)
        }

        while (!isPuncToken(';')) {  // @import 'foundation/code', 'foundation/lists';
            params.push(processFilenameExp(consumeNextTokenWithLoc()));
            if (isPuncToken(',')) {
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
            bodyStatement: BodyStatement;

        testExpression = maybeBinaryNode(dispatchParser(), 0);

        bodyStatement = parseBody();

        if (isKwToken('@else')) {
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

        return createIfStatement(testExpression, bodyStatement, alternate)
    }

    function parseEach(): EachStatement {
        let left = dispatchParser();

        /**
         * skip "in" expression
          */

        input.next();

        let right = dispatchParser();

        skipPunc('{')
        let bodyStatement = parseStatement()
        skipPunc('}')
        return createEachStatement(left, right, bodyStatement)
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
                input.emitError(ErrorCodes.UNDEFINED_VARIABLE, node.loc, `${node} should be a variable which starts with '$'`)
            }
            skipPunc('}')
            return createVarKeyExpression(node.value, {
                start: varKeyStartLoc,
                end: node.loc.end,
                filename
            })
        }

        let token = consumeNextTokenWithLoc(); // token maybe '#'

        if (isPuncToken('{')) {
            return parse_key_var_wrapper(token.loc.start)
        }

        /**
         * color: #1212; or #selector{}
          */
        let nextToken = consumeNextTokenWithLoc();

        if (nextToken.type !== NodeTypes.TEXT) {
            input.emitError(ErrorCodes.EXPECTED_X, nextToken.loc, `[maybeVarKeyWrapper]: expect str token but received ${nextToken.value}`)
        }

        return createTextNode(token.value + nextToken.value, {
            start: token.start,
            end: nextToken.end,
            filename
        })
    }

    function maybeDeclaration(exp) {
        let expr = exp();

        /**
         * PseudoClassSelector may also enter which is not Declaration
         *  &:not([disabled]):hover{}
         *  
         */

        if (isAssignToken()) {
            /**
             * solve scenario default value, prevent from ll(n) check eg:
             * @mixin avatar($size, $circle: false) {}
             * @include avatar(100px, $circle: false);
             * 
             */
            if (expr.type === NodeTypes.VARIABLE) {
                return parseDeclaration(expr)
            }

            /**
             * solve complicated selector eg:
             * &:not([disabled]):hover {}
             */

            let lln = 1,
                predictToken: Token;
            while (true) {
                predictToken = input.peek(lln);
                if (predictToken.value === ';' || predictToken.value === '}') { // treat as NodeTypes.DECLARATION

                    return parseDeclaration(expr)

                } else if (predictToken.value === '{') { // treat as NodeTypes.SELECTOR

                    return parseRule(
                        createSelectorNode(
                            createListNode(
                                range(lln - 1).map((): SimpleExpressionNode => {
                                    let tok = consumeNextTokenWithLoc()
                                    tok.type = NodeTypes.TEXT // transform to NodeTypes.TEXT
                                    return tok;
                                })
                            )
                        )
                    )

                } else {
                    lln++
                }
            }
        }

        /**
         * handle selector may contain key_var, which should be resolved to list ast
         * .icon-#{$size} {}
        */

        if (isPuncToken('#')) {
            return maybeDeclaration(() => {
                return createListNode(
                    expr.type === NodeTypes.LIST ?
                        expr.value.concat(dispatchParser())
                        : [expr].concat(dispatchParser()))
            })
        }

        if (isPuncToken('{')) {
            return parseRule(createSelectorNode(expr)) //passin selector
        }

        return expr;
    }

    function parseStatement() {
        return maybeDeclaration(function () {
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