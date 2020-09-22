import { NodeTransform, TransformContext } from '../transform'
import { Node, NodeTypes, Statement, BodyStatement, ChildStatement, IncludeStatement, MixinStatement, IfStatement, EachStatement } from '../parse/ast'
import { deepClone, createEmptyNode, isEmptyNode, addNodeEmptyLocation } from '../parse/util';
import { processExpression } from './transformExpression';
import { processAssign } from './transformAssign';
import {
    ErrorCodes,
    createCompilerError
} from '../parse/errors';

export const transformStatement: NodeTransform = (node, context) => {
    processStatement(node as Statement,context)
}


export function processStatement(
    node: Statement,
    context: TransformContext,
) {

    function dispatchStatement(node: Statement, context: TransformContext) {

        // console.log(context.env.parent)

        switch (node.type) {
            /**
            * Statement
            */
            case NodeTypes.ASSIGN: return processAssign(node, context);
            case NodeTypes.MIXIN: return transform_mixin(node, context);
            case NodeTypes.INCLUDE: return transform_include(node, context);
            case NodeTypes.CHILD:
            case NodeTypes.BODY:
                return transform_child_or_body(node, context);

            case NodeTypes.EXTEND: return node;
            case NodeTypes.IFSTATEMENT: return transform_if(node, context);
            case NodeTypes.EACHSTATEMENT: return transform_each(node, context);

            case NodeTypes.ERROR:
                throw new Error(processExpression(node.value, context).value)

            default: throw createCompilerError(ErrorCodes.UNKNOWN_STATEMENT_TYPE, (node as Node).loc, (node as Node).type)
        }
    }

    /**
     * any expressions separated with spaces or commas count as a list
     */
    function transform_each(node: EachStatement, context: TransformContext) {
        let restoredContext = deepClone(node),
            right = processExpression(restoredContext.right, context),
            scope = context.env.extend(),
            list:string[] = [];

        if (right.type === NodeTypes.TEXT) {
            list = right.value.split(/,|\s+/).filter(val => val !== '')
        }

        let children = list.map(val => {
            /**
             * restore context with iterate multiple times
             */

            restoredContext = deepClone(node);

            scope.def(restoredContext.left.value, val);

            return dispatchStatement(restoredContext.body, { ...context,env:scope})
        })

        /**
         * return a created an empty selector child whose children will be flattened in transform_nest
         */
        let child: ChildStatement = {
            ...node,
            type: NodeTypes.CHILD,
            selector: addNodeEmptyLocation({
                type: NodeTypes.TEXT,
                value: ''
            }),
            children
        }

        return child;
    }
    /**
     * context will be restored with function 
     */
    function transform_if(node: IfStatement, context: TransformContext) {

        function is_true_exp(expression, context: TransformContext) {

            let resultExp = expression;
            /**
             *  1. if $bool { }
             *  2. if true { }
            */

            if (resultExp.type === NodeTypes.VARIABLE || resultExp.type === NodeTypes.BINARY) {
                resultExp = processExpression(expression, context);
            }

            if (resultExp.value === "0" || resultExp.value === "false") {
                return false;
            }

            return true
        }

        if (is_true_exp(node.test, context)) {
            return dispatchStatement(node.consequent, context);
        } else if (node.alternate) {
            return dispatchStatement(node.alternate, context)
        } else {
            return createEmptyNode();
        }
    }

    /**
     * transform @mixin -> set to env -> delete @mixin ast
     */
    function transform_mixin(node: MixinStatement, context: TransformContext) {

        function make_function() {

            /**
             * deep clone function statement to restore context when called multiple times
             */

            let restoredContext: MixinStatement = deepClone(node),
                params = restoredContext.params,
                scope = context.env.extend();

            function handle_params_default_value(params) {
                return params.map((param) => {
                    let ret = param;
                    if (param.type === NodeTypes.ASSIGN) {
                        ret = {
                            type: NodeTypes.VARIABLE,
                            value: param.left.value
                        }
                        dispatchStatement(param, { ...context, env: scope })
                    }
                    return ret;
                })
            }

            params = handle_params_default_value(params);

            params.forEach((param, i) => {
                if (param.type === NodeTypes.VARIABLE && arguments[i]) {
                    scope.def(param.value, arguments[i])
                }
            })

            return dispatchStatement(restoredContext.body, { ...context, env: scope });
        }

        context.env.def(node.id.value, make_function)

        return createEmptyNode();
    }

    function transform_include(node: IncludeStatement, context: TransformContext) {
        let func = context.env.get(node.id.value);
        return func.apply(null, node.args.map(arg => {

            /**
             * @include avatar(100px, $circle: false);
             */
            if (arg.type === NodeTypes.ASSIGN) {
                return processExpression(arg.right, context).value
            }else{
                return processExpression(arg, context).value
            }

        }))
    }

    function transform_child_or_body(node:ChildStatement | BodyStatement, context:TransformContext) {

        function flatten_included_body(children: Statement[]): Statement[] {
            let arr: Statement[] = []
            children.forEach(child => {
                if (child.type === NodeTypes.BODY) {
                    arr = arr.concat(flatten_included_body(child.children))
                } else {
                    arr.push(child)
                }
            })
            return arr;
        }

        let scope = context.env.extend();

        node.children = (node.children as Statement[]).map(child => dispatchStatement(child, { ...context, env: scope })).filter(node => !isEmptyNode(node));
        if (node.selector && node.selector.type === NodeTypes.LIST) {
            node.selector = processExpression(node.selector, { ...context,env:scope})
        }
        /**
         * resolve BlockStatement/body
         * 
         * @include include_function_body
         * @if which contain BlockStatement
          */
        node.children = flatten_included_body(node.children as Statement[]);

        return node;
    }

    return context.replaceNode(dispatchStatement(node, context))
}