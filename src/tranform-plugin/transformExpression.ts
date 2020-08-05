import { NodeTransform, TransformContext } from '../transform'
import { NodeTypes, SimpleExpressionNode, TextNode } from '../parse/ast'
import { fillWhitespace} from '../parse/util'
export const transformExpression: NodeTransform = (node, context) => {

}

export function processExpression(
    node: SimpleExpressionNode,
    context: TransformContext,
): TextNode {

    function dispatchExpression(node:SimpleExpressionNode, context) {
        switch (node.type) {
            /**
             * Expression
             */
            case NodeTypes.TEXT: return transformText(node);
            case NodeTypes.PUNC: return transformPunc(node);
            case NodeTypes.OPERATOR: return transformOp(node);
            case NodeTypes.VARIABLE: return transformVar(node, context);
            case NodeTypes.VAR_KEY: return transformVarKey(node, context);
            case NodeTypes.LIST: return transformList(node, context);
            case NodeTypes.BINARY: return transformBinary(node, context);

            default:
                throw new Error("Don't know how to processExpression expression for " + JSON.stringify(node));
        }
    }

    /**
     * Solve situation, assign value with NodeTypes.PUNC, eg:
     * $font: Helvetica, sans-serif;
     */
    function transformPunc(node) {
        node.type = NodeTypes.TEXT
        return node;
    }

    /**
     * Solve situation, selector with operators, eg:
     * .a > b{}
     */
    function transformOp(node) {
        return transformPunc(node);
    }

    function transformText(node) {
        return node;
    }

    function transformVar(node, context) {
        node.type = NodeTypes.TEXT;
        node.value = context.env.get(node.value);
        return node;
    }

    function transformVarKey(node, context) {
        return transformVar(node, context);
    }

    function transformList(node, context) {
        let list = node.value
        return {
            type: NodeTypes.TEXT,
            loc:{
                start:list[0].loc.start,
                end:list[list.length-1].loc.end
            },
            value: fillWhitespace(list).map(item => {
                return dispatchExpression(item, context).value
            }).join('').trim()
        }
    }


    /**
     * Todos:add more unit type eg: pt px etc
     * 
     */
    function transformBinary(node, context) {

        let hasPercent = false,
            unitExtracted = false,
            unit = "";

        function parseFloatFn(str) {

            if (isNaN(parseFloat(str))) {
                return str;
            }

            if (str === "100%") {
                hasPercent = true;
                return 1;
            }

            /**
             * make the first encountered unit as the final unit
              */
            if (!unitExtracted) {
                unitExtracted = true;
                let matched = str.match(/\d+([a-z]*)/);
                unit = matched && matched.length > 0 ? matched[1] : ''
            }

            return parseFloat(str)
        }

        function transformVal(str) {
            function transformPercent(str) {
                return parseFloat(str) * 100 + "%";
            }
            function addUnit(str) {
                return str + unit;
            }
            return hasPercent ? transformPercent(str) : addUnit(str)
        }

        function evaluateBinary(ast) {

            const opAcMap = {
                // '=': (left, right) => left = right,
                '||': (left, right) => left || right,
                '&&': (left, right) => left && right,

                '==': (left, right) => left == right,
                '!=': (left, right) => left != right,
                '>=': (left, right) => left >= right,
                '<=': (left, right) => left <= right,

                '+': (left, right) => left + right,
                '-': (left, right) => left - right,
                '/': (left, right) => left / right,
                '*': (left, right) => left * right,
                '%': (left, right) => left % right,

            };

            if (ast.type === NodeTypes.TEXT) return parseFloatFn(ast.value);
            if (ast.type === NodeTypes.VARIABLE) return evaluateBinary({
                type: NodeTypes.TEXT,
                value: context.env.get(ast.value)
            })
            if (ast.type === NodeTypes.BINARY) return opAcMap[ast.operator](evaluateBinary(ast.left), evaluateBinary(ast.right));

            throw new Error("Don't know how to evaluateBinary type: " + ast.type);
        };

        let value = evaluateBinary(node);

        return {
            type: NodeTypes.TEXT,
            value: transformVal(value)
        }
    }

    return dispatchExpression(node,context)
}