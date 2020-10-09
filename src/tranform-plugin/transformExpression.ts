import { NodeTransform, TransformContext } from '../transform'
import { NodeTypes, SimpleExpressionNode, TextNode, VariableNode, BinaryNode, Node, PuncNode, OperatorNode, VarKeyNode, ListNode, CallExpression, IncludeStatement } from '../parse/ast'
import { fillWhitespace } from '../parse/util'
import {
    defaultOnError,
    ErrorCodes,
    createCompilerError
} from '../parse/errors';

export const transformExpression: NodeTransform = (node, context) => {

}
export function callFunctionWithArgs(func: Function, node: IncludeStatement | CallExpression, context: TransformContext) {
    return func.apply(null, node.args.map(arg => {

        /**
         * @include avatar(100px, $circle: false);
         */
        if (arg.type === NodeTypes.ASSIGN) {
            return processExpression(arg.right, context).value
        } else {
            return processExpression(arg, context).value
        }

    }))
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
            case NodeTypes.CALL: return transformCall(node, context);
            case NodeTypes.VAR_KEY: return transformVarKey(node, context);
            case NodeTypes.LIST: return transformList(node, context);
            case NodeTypes.BINARY: return transformBinary(node, context);

            default: throw createCompilerError(ErrorCodes.UNKNOWN_EXPRESSION_TYPE, (node as Node).loc, (node as Node).type)
        }
    }

    /**
     * Solve situation, assign value with NodeTypes.PUNC, eg:
     * $font: Helvetica, sans-serif;
     */
    function transformPunc(node: PuncNode | OperatorNode): TextNode {
        return {
            ...node,
            type: NodeTypes.TEXT
        };
    }

    /**
     * Solve situation, selector with operators, eg:
     * .a > b{}
     */
    function transformOp(node: OperatorNode): TextNode {
        return transformPunc(node);
    }

    function transformText(node: TextNode): TextNode {
        return node;
    }

    function transformVar(node: VariableNode | VarKeyNode, context: TransformContext): TextNode {
        let value = context.env.get(node.value);
        if (typeof value === 'undefined') {
            defaultOnError(
                createCompilerError(ErrorCodes.UNDEFINED_VARIABLE, node.loc, node.value)
            )
        }
        return {
            ...node,
            type: NodeTypes.TEXT,
            value: value
        };
    }

    function transformCall(node: CallExpression, context: TransformContext): TextNode {
       
        function convertCallNodeToString(node:CallExpression):string {
            return node.id.value + '(' + node.args.map(node=>{
                if(node.type === NodeTypes.ASSIGN){
                    return defaultOnError(
                        createCompilerError(ErrorCodes.EXPECTED_X, node.loc, ',')
                    )
                }
                return processExpression(node,context).value

            }).join(',') +')'
        }
        // maybe a custom defined function or undefined
        let func = context.env.get(node.id.value),
            value:string;
        if (typeof func === 'function'){
            value = callFunctionWithArgs(func, node, context)
        }else{
            value = convertCallNodeToString(node)
        }

        return {
            loc:node.loc,
            type: NodeTypes.TEXT,
            value
        };
    }

    function transformVarKey(node: VarKeyNode, context: TransformContext) {
        return transformVar(node, context);
    }

    function transformList(node: ListNode, context: TransformContext): TextNode {
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
    function transformBinary(node: BinaryNode, context: TransformContext): TextNode {

        let hasPercent = false,
            unitExtracted = false,
            unit = "";

        function parseFloatFn(str: string): number | string {

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
                let matched = str.match(/\d+([a-z]*)/);
                unit = matched && matched.length > 0 ? matched[1] : ''
                if(unit){
                    unitExtracted = true;
                }
            }

            return parseFloat(str)
        }

        function transformVal(str: string | number): string {
            function transformPercent(str) {
                return parseFloat(str) * 100 + "%";
            }
            function addUnit(str) {
                return str + unit;
            }
            return hasPercent ? transformPercent(str) : addUnit(str)
        }

        function evaluateBinary(node: TextNode | VariableNode | BinaryNode | CallExpression, nearestOperator: OperatorNode['value']): number | string {

            const opAcMap = {
                // '=': (left, right) => left = right,
                '||': (left, right) => left || right,
                '&&': (left, right) => left && right,

                '==': (left, right) => left == right,
                '!=': (left, right) => left != right,
                '>=': (left, right) => left >= right,
                '<=': (left, right) => left <= right,

                '>': (left, right) => left > right,
                '<': (left, right) => left < right,

                '+': (left, right) => left + right,
                '-': (left, right) => left - right,
                '/': (left, right) => left / right,
                '*': (left, right) => left * right,
                '%': (left, right) => left % right,

            };

            if (node.type === NodeTypes.TEXT) {
                let value = parseFloatFn(node.value)
                if (['+', '-', '*', '/', '%'].includes(nearestOperator) && (typeof value !== 'number')) {
                    throw createCompilerError(ErrorCodes.EXPECT_BINARY_COMPUTE_TO_BE_NUMBER, (node as Node).loc, (node as Node).value)
                }
                return value;
            }

            if (node.type === NodeTypes.VARIABLE) {
                return evaluateBinary(transformVar(node, context),nearestOperator);
            }

            if (node.type === NodeTypes.CALL) {
                return evaluateBinary(transformCall(node, context), nearestOperator);
            }
            
            if (node.type === NodeTypes.BINARY) {
                let left = evaluateBinary(node.left, node.operator.value),
                    right = evaluateBinary(node.right, node.operator.value);
                return opAcMap[node.operator.value](left, right);
            }


            throw createCompilerError(ErrorCodes.UNKNOWN_EVALUATE_BINARY_TYPE, (node as Node).loc, (node as Node).type + ':' + (node as Node).value)
        };

        let value = evaluateBinary(node,node.operator.value);

        return {
            ...node,
            type: NodeTypes.TEXT,
            value: transformVal(value),
        }
    }

    return dispatchExpression(node, context)
}