import {
    NodeTypes,
    TextNode,
    puncType,
    arithmeticOperator,
} from './ast';

const debug = (function () {
    let isDebug = false,
        count = 0;
    return () => {
        if (count++ > 20 && isDebug) {
            return true;
        }
        return false;
    }
})()


function is_calculate_op_char(ch:arithmeticOperator) {
    let op_chars = ' + - * / % '
    return op_chars.indexOf(' ' + ch + ' ') >= 0;
}

function is_punc(ch: puncType) {
    return ",;(){}#".indexOf(ch) >= 0; // support expr { #{var}:var }
}

const PRECEDENCE = {
    "=": 1,
    "||": 2,
    "&&": 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20,
};

function is_operator(op:string) {
    return Object.keys(PRECEDENCE).includes(op)
}
 /**
  * fill whitespace between tokens which is removed in lexical analyze
  * 
  */

function fillWhitespace(tokens: TextNode[]) {
     if (tokens.length <= 1) return tokens;

     let list = [],
         whitespaceToken = {
             type: NodeTypes.TEXT,
             value: ' '
         },
         curIndex = 0,
         curToken = null,
         nextToken = null;

     while (curIndex < tokens.length - 1) {
         curToken = tokens[curIndex];
         nextToken = tokens[curIndex + 1];
         list.push(curToken)
         if (nextToken.loc.start.offset > curToken.loc.end.offset) {
             list.push({
                 start: curToken.loc.end.offset+ 1,
                 end: curToken.loc.end.offset + 2,
                 ...whitespaceToken
             })
         }
         curIndex++;
     }

     list.push(tokens[curIndex])

     return list;
 }


module.exports = {
    debug,
    PRECEDENCE,
    fillWhitespace,
    is_calculate_op_char,
    is_punc,
    is_operator
}