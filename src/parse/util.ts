import {
    NodeTypes,
    TextNode,
    puncType,
    arithmeticOperator,
    EmptyNode,
    Node
} from './ast';

export const isArray = Array.isArray

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

     let list:TextNode[] = [],
         whitespaceToken:TextNode = {
             type: NodeTypes.TEXT,
             value: ' ',
             loc:{
                 start:{
                     offset:0,
                     column:0,
                     line:0
                 },
                 end:{
                     offset: 0,
                     column: 0,
                     line:0
                 }
             }
         },
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

class Environment  {
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
        throw new Error("Undefined variable " + name);
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
function deepClone(obj:object) {
    return JSON.parse(JSON.stringify(obj))
}

function addNodeEmptyLocation(node){
    return Object.assign({}, node, {
        start: {
            offset: 0,
            column: 0,
            line: 0
        },
        end: {
            offset: 0,
            column: 0,
            line: 0
        }
    })
}
function createEmptyNode(): EmptyNode {
    return addNodeEmptyLocation({
        type: NodeTypes.EMPTY,
    })
}

function isEmptyNode(node: Node):boolean{
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

export {
    debug,
    PRECEDENCE,
    fillWhitespace,
    is_calculate_op_char,
    is_punc,
    is_operator,
    Environment,
    deepClone,
    createEmptyNode,
    isEmptyNode,
    addNodeEmptyLocation
}