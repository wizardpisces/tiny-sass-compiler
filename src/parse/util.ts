import {
    NodeTypes,
    TextNode,
    puncType,
    arithmeticOperator,
    Node,
    Position,
    SimpleExpressionNode,
    createTextNode
} from './ast';

export const isArray = Array.isArray

export const debug = (function () {
    let isDebug = false,
        count = 0;
    return () => {
        if (count++ > 20 && isDebug) {
            return true;
        }
        return false;
    }
})()


export function is_calculate_op_char(ch: arithmeticOperator | string) {
    let op_chars = ' + - * / % '
    return op_chars.indexOf(' ' + ch + ' ') >= 0;
}

export function is_punc(ch: string | puncType): boolean {
    return ",;(){}#".indexOf(ch) >= 0; // support expr { #{var}:var }
}

export const PRECEDENCE = {
    "=": 1,
    "||": 2,
    "&&": 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20,
};

export function is_operator(op: string) {
    return Object.keys(PRECEDENCE).includes(op)
}

export function isKeyframesName(name: string): boolean {
    return name.indexOf('keyframes') > -1
}
/**
 * fill whitespace between tokens which is removed in lexical analyze
 * 
 */

export function fillWhitespace(tokens: SimpleExpressionNode[]) {
    if (tokens.length <= 1) return tokens;

    let list: SimpleExpressionNode[] = [],
        whitespaceToken: TextNode = createTextNode(' '),
        curIndex = 0,
        curToken,
        nextToken;

    while (curIndex < tokens.length - 1) {
        curToken = tokens[curIndex];
        nextToken = tokens[curIndex + 1];
        list.push(curToken)
        if (nextToken.loc.start.offset > curToken.loc.end.offset) {
            // one whitespace is enough to demonstrate semantics
            list.push(whitespaceToken)
        }
        curIndex++;
    }

    list.push(tokens[curIndex])

    return list;
}

/**
 * todos: optimize deep_clone
 */
export function deepClone(obj: object) {
    return JSON.parse(JSON.stringify(obj))
}

export function isEmptyNode(node: Node): boolean {
    return node.type === NodeTypes.EMPTY
}

export function isMediaNode(node: Node): boolean {
    return node.type === NodeTypes.Atrule && node.name === 'media';
}

// function createPromiseCallback() {
//     var resolve, reject;
//     var promise = new Promise(function (_resolve, _reject) {
//         resolve = _resolve;
//         reject = _reject;
//     });
//     var cb = function (err, res) {
//         if (err) { return reject(err) }
//         resolve(res || '');
//     };
//     return { promise: promise, cb: cb }
// }

// advance by mutation without cloning (for performance reasons), since this
// gets called a lot in the parser
export function advancePositionWithMutation(
    pos: Position,
    source: string,
    numberOfCharacters: number = source.length
): Position {
    let linesCount = 0
    let lastNewLinePos = -1
    for (let i = 0; i < numberOfCharacters; i++) {
        if (source.charCodeAt(i) === 10 /* newline char code */) {
            linesCount++
            lastNewLinePos = i
        }
    }

    pos.offset += numberOfCharacters
    pos.line += linesCount
    pos.column =
        lastNewLinePos === -1
            ? pos.column + numberOfCharacters
            : numberOfCharacters - lastNewLinePos

    return pos
}

export function range(n: number) {
    let list: number[] = [],
        i = 0;
    while (n--) {
        list.push(i++)
    }
    return list
}
