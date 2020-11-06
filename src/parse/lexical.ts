/**
 * 
 * @param {input_stream processed stream method} input 
*/

import {
    is_calculate_op_char,
    is_punc
} from './util'

import { NodeTypes } from './ast';
import {
    ErrorCodes
} from './errors';

export default function lex(input) {

    let keywords = ' @extend @mixin @include @import @if @else @error @each @function @return',
        comparison_op_chars = '!=><',
        comparison_op_tokens = ['==', '!=', '>=', '<=', '>', '<'],
        /** 
         * special treatment for internal callExpression which will be increased overtime
         * parse.ts also treat undiscoverd internal call expression as string when transformed
         * 
         * Todos: will be replaced by in depth analyze
         */ 
        internalCallIdentifiers = ['url'];

    return {
        next,
        peek,
        eliminateWhitespace,
        eof,
        getCoordination: input.getCoordination,
        setCoordination: input.setCoordination,
        emitError: input.emitError
    }

    function is_comment_char(ch) {
        return "/".indexOf(ch) >= 0;
    }

    function is_id_start(ch) {
        return /[$]/.test(ch);
    }

    function skip_comment() {
        read_while(function (ch) { return ch != "\n" });
        input.next();
    }

    function is_comparison_op_char(ch) {
        // return "+-*/%=&|<>!".indexOf(ch) >= 0;
        return comparison_op_chars.indexOf(ch) >= 0;
    }

    function is_comparison_op_tokens(str) {
        return comparison_op_tokens.indexOf(str) >= 0;
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

    function is_keyword(kw) {
        return keywords.indexOf(" " + kw + " ") >= 0;
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
        let str = "";
        while (!input.eof() && predicate(input.peek()))
            str += input.next();
        return str;
    }

    function readInternalCall(callName: string) {
        let params = read_end(')')
        input.next();// skip ')
        return {
            type: NodeTypes.TEXT,
            value: `${callName}${params})`
        }
    }

    function read_keyword() {
        let kw = read_while(is_base_char);

        if (!is_keyword(kw)) {
            // unknown keyword handle moved to parse.ts dispatchParser
        }

        if (internalCallIdentifiers.includes(kw)) { //treat inner call as string, possible @media
            let callStr = readInternalCall(kw)
            return callStr;
        }

        return {
            type: NodeTypes.KEYWORD,
            value: kw
        };
    }

    function read_assign_char() {
        return {
            type: NodeTypes.DECLARATION,
            value: input.next()
        }
    }

    function read_ident() {
        let id = read_while(is_id_char_limit);
        return {
            type: NodeTypes.VARIABLE,
            value: id.trim()
        };
    }

    function generate_op_token(op) {
        return {
            type: NodeTypes.OPERATOR,
            value: op
        }
    }

    function read_end(endReg: string | RegExp) {
        let str = "";
        let is_ended = typeof endReg === 'string' ? 
            (ch: string): boolean => endReg === ch :
            (ch: string): boolean => endReg.test(ch)

        while (!input.eof()) {
            let ch = input.peek();
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
        /**
         * '#' end eg:
         * .icon-#{$size} {}
         */
        let str = read_end(/[,;{}():#\s]/);

        if (internalCallIdentifiers.includes(str)) {//possible internal url
            let callStr = readInternalCall(str);

            return callStr;
        }

        return {
            type: NodeTypes.TEXT,
            value: str
        };
    }

    function maybe_comment(ch) {

        if (is_comment_char(input.peek())) {
            skip_comment();
            return read_next()
        } else {
            return generate_op_token(ch)
        }
    }

    function maybe_placeholder(ch) {
        if (is_base_char(input.peek())) {
            return {
                type: NodeTypes.PLACEHOLDER,
                value: ch + read_while(is_base_char)
            }
        } else {
            return generate_op_token(ch)
        }
    }

    function maybe_calculate_op_token(chStr) {
        if (input.peek() === ' ') {
            return generate_op_token(chStr);
        } else {
            return {
                type: NodeTypes.TEXT,
                value: chStr + read_string().value
            };
        }
    }

    function maybe_comparison_op_token(chStr) {
        if (is_comparison_op_tokens(chStr)) {

            return generate_op_token(chStr);
        } else {
            return {
                type: NodeTypes.TEXT,
                value: chStr + read_string().value
            };
        }
    }

    function read_punc(ch) {
        return {
            type: NodeTypes.PUNC,
            value: ch
        }
    }

    function maybe_punc(ch) {
        if (input.peek() === '{') {
            return read_punc(ch);
        } else {
            return {
                type: NodeTypes.TEXT,
                value: ch + read_string().value
            };
        }
    }

    function read_next() {
        read_while(is_whitespace);
        if (input.eof()) return null;
        let ch = input.peek();

        /**
         * comment //  contains op /
         * Todos:还未支持多行注释如：\/**\/
        */
        if (is_comment_char(ch)) return maybe_comment(input.next());
        if (is_placeholder_start(ch)) return maybe_placeholder(input.next());// @extend %message-shared;  contains op '%'

        if (is_assign_char(ch)) return read_assign_char();
        if (is_id_start(ch)) return read_ident();
        if (is_punc(ch)) {
            if (ch === '#') {
                return maybe_punc(input.next())
            }
            return read_punc(input.next())
        }
        if (is_keyword_start(ch)) return read_keyword();//eg: @extend .message-shared;
        if (is_calculate_op_char(ch)) return maybe_calculate_op_token(read_while(is_calculate_op_char));
        if (is_comparison_op_char(ch)) return maybe_comparison_op_token(read_while(is_comparison_op_char));
        if (is_base_char(ch)) return read_string();

        input.emitError(ErrorCodes.UNKNOWN_CHAR);
    }

    /**
     * reset coordination after peek value
     */
    function peek_next() {
        let coordination = input.getCoordination()
        let tok = read_next();
        input.setCoordination(coordination)
        return tok;
    }

    function peek() {
        return peek_next();
    }
    function next() {
        return read_next();
    }

    function eliminateWhitespace() {
        read_while(is_whitespace);
    }

    function eof() {
        return peek() == null;
    }

}