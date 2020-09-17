import {
    NodeTypes,
    TextNode,
    puncType,
    arithmeticOperator,
    EmptyNode,
    Node,
    Position,
    SimpleExpressionNode,
    locStub
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


export function is_calculate_op_char(ch:arithmeticOperator) {
    let op_chars = ' + - * / % '
    return op_chars.indexOf(' ' + ch + ' ') >= 0;
}

export function is_punc(ch: puncType) {
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

export function is_operator(op:string) {
    return Object.keys(PRECEDENCE).includes(op)
}
 /**
  * fill whitespace between tokens which is removed in lexical analyze
  * 
  */

export function fillWhitespace(tokens: SimpleExpressionNode[]) {
     if (tokens.length <= 1) return tokens;

    let list: SimpleExpressionNode[] = [],
         whitespaceToken:TextNode = addNodeEmptyLocation({
             type: NodeTypes.TEXT,
             value: ' '
         }),
         curIndex = 0,
         curToken,
         nextToken;

     while (curIndex < tokens.length - 1) {
         curToken = tokens[curIndex];
         nextToken = tokens[curIndex + 1];
         list.push(curToken)
         if (nextToken.loc.start.offset > curToken.loc.end.offset) {
             list.push(whitespaceToken)
         }
         curIndex++;
     }

     list.push(tokens[curIndex])

     return list;
 }

export class Environment  {
    vars : { [name:string] :any}
    parent: Environment | null

    constructor(parent:Environment | null){
        this.vars = Object.create(parent ? parent.vars : null);
        this.parent = parent;
    }

    extend() {
        return new Environment(this);
    }
    // lookup: function (name) {
    //     let scope = this;
    //     while (scope) {
    //         if (Object.prototype.hasOwnProperty.call(scope.vars, name))
    //             return scope;
    //         scope = scope.parent;
    //     }
    // },
    get(name:string) {
        if (name in this.vars)
            return this.vars[name];
    }
    // set: function (name, value) {
    //     let scope = this.lookup(name);
    //     // let's not allow defining globals from a nested environment
    //     if (!scope && this.parent)
    //         throw new Error("Undefined variable " + name);
    //     return (scope || this).vars[name] = value;
    // },
    def(name:string, value:any) {
        return this.vars[name] = value;
    }
};

/**
 * todos: optimize deep_clone
 */
export function deepClone(obj:object) {
    return JSON.parse(JSON.stringify(obj))
}

// Some expressions, e.g. sequence and conditional expressions, are never
// associated with generated code, so their source locations are just a empty.
export function addNodeEmptyLocation(node){
    node.loc = locStub;
    return node;
}
export function createEmptyNode(): EmptyNode {
    return addNodeEmptyLocation({
        type: NodeTypes.EMPTY,
    })
}

export function isEmptyNode(node: Node):boolean{
    return node.type === NodeTypes.EMPTY
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