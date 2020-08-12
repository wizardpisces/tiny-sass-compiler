import { NodeTransform , TransformContext} from '../transform'
import { NodeTypes, SimpleExpressionNode, TextNode, VariableNode, BinaryNode, Node, PuncNode, OperatorNode, VarKeyNode, ListNode} from '../parse/ast'
import { fillWhitespace} from '../parse/util'
export const transformExpression: NodeTransform = (node, context) => {

}

export function processExpression(
    node: SimpleExpressionNode,
    context: TransformContext,
): TextNode {
    function dispatchExpression(node: SimpleExpressionNode, context: TransformContext) {
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
    function transformPunc(node:PuncNode | OperatorNode): TextNode {
        return {
            ...node,
            type: NodeTypes.TEXT
        };
    }

    /**
     * Solve situation, selector with operators, eg:
     * .a > b{}
     */
    function transformOp(node:OperatorNode): TextNode {
        return transformPunc(node);
    }

    function transformText(node:TextNode): TextNode {
        return node;
    }

    function transformVar(node: VariableNode | VarKeyNode, context: TransformContext):TextNode {
        return {
            ...node,
            type:NodeTypes.TEXT,
            value: context.env.get(node.value)
        };
    }

    function transformVarKey(node: VarKeyNode, context: TransformContext) {
        return transformVar(node, context);
    }

    function transformList(node:ListNode, context: TransformContext):TextNode {
        return {
            type: NodeTypes.TEXT,
            loc: node.loc,
            value: fillWhitespace(node.value).map((item) => {
                return dispatchExpression(item, context).value
            }).join('').trim()
        }
    }


    /**
     * Todos:add more unit type eg: pt px etc
     * 
     */
    function transformBinary(node:BinaryNode, context: TransformContext): TextNode {

        let hasPercent = false,
            unitExtracted = false,
            unit = "";

        function parseFloatFn(str:string): number | string {

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

        function transformVal(str:string | number):string {
            function transformPercent(str) {
                return parseFloat(str) * 100 + "%";
            }
            function addUnit(str) {
                return str + unit;
            }
            return hasPercent ? transformPercent(str) : addUnit(str)
        }

        function evaluateBinary(node:TextNode | VariableNode | BinaryNode): number | string {

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

            if (node.type === NodeTypes.TEXT) return parseFloatFn(node.value);
            if (node.type === NodeTypes.VARIABLE) return evaluateBinary({
                ...node,
                type: NodeTypes.TEXT,
                value: context.env.get(node.value),
            })
            if (node.type === NodeTypes.BINARY) return opAcMap[node.operator.value](evaluateBinary(node.left), evaluateBinary(node.right));

            throw new Error("Don't know how to evaluateBinary type: " + (node as Node).type);
        };

        let value = evaluateBinary(node);

        return {
            ...node,
            type: NodeTypes.TEXT,
            value: transformVal(value),
        }
    }

    return dispatchExpression(node, context)
}