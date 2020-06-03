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


function is_calculate_op_char(ch) {
    let op_chars = ' + - * / % '
    return op_chars.indexOf(' ' + ch + ' ') >= 0;
}

function is_punc(ch) {
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

function is_operator(op) {
    return Object.keys(PRECEDENCE).includes(op)
}
 /**
  * fill whitespace between tokens which is removed in lexical analyze
  * 
  */

 function fillWhitespace(tokens) {
     if (tokens.length <= 1) return tokens;

     let list = [],
         whitespaceToken = {
             type: 'str',
             value: ' '
         },
         curIndex = 0;

     while (curIndex < tokens.length - 1) {
         list.push(tokens[curIndex])
         if (tokens[curIndex + 1].start > tokens[curIndex].end) {
             list.push({
                 start: tokens[curIndex].end + 1,
                 end: tokens[curIndex].end + 2,
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