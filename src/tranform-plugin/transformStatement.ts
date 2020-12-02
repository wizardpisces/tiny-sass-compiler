import { NodeTransform, TransformContext } from '../transform'
import {
    Node,
    NodeTypes,
    Statement,
    BodyStatement,
    RuleStatement,
    IncludeStatement,
    MixinStatement,
    IfStatement,
    EachStatement,
    FunctionStatement,
    ReturnStatement,
    TextNode,
    createTextNode,
    createEmptyNode,
    createSelectorNode,
    Atrule,
    MediaStatement,
    createRuleStatement,
    Keyframes,
    ContentPlaceholder
} from '../parse/ast'
import { deepClone, isEmptyNode, isKeyframesName } from '../parse/util';
import { processExpression, callFunctionWithArgs } from './transformExpression';
import { processAssign } from './transformAssign';
import {
    ErrorCodes,
    createCompilerError
} from '../parse/errors';

export const transformStatement: NodeTransform = (node, context) => {
    return processStatement(node as Statement, context)
}


export function processStatement(
    node: Statement,
    context: TransformContext,
) {

    function dispatchStatement(node: Statement | ContentPlaceholder, context: TransformContext) {

        // console.log(context.env.parent)

        switch (node.type) {
            /**
            * Statement
            */
            case NodeTypes.DECLARATION: return processAssign(node, context);
            case NodeTypes.MIXIN:
            case NodeTypes.FUNCTION: return transformMixnOrFunction(node, context);
            case NodeTypes.RETURN: return transformReturn(node, context);
            case NodeTypes.CONTENT: return transformContent(context);
            case NodeTypes.INCLUDE: return transformInclude(node, context);
            case NodeTypes.RULE:
            case NodeTypes.BODY:
                return transformChildOrBody(node, context);

            case NodeTypes.EXTEND: return node;
            case NodeTypes.IFSTATEMENT: return transformIf(node, context);
            case NodeTypes.EACHSTATEMENT: return transformEach(node, context);
            case NodeTypes.Atrule: return transformAtRule(node, context);

            case NodeTypes.ERROR:
                throw new Error(processExpression(node.value, context).value)

            default: throw createCompilerError(ErrorCodes.UNKNOWN_STATEMENT_TYPE, (node as Node).loc, (node as Node).type)
        }
    }

    function transformMedia(node: MediaStatement, context: TransformContext): MediaStatement {

        // Todos: skip parseExpression for now, mainly to test media bubble
        node.prelude.children = node.prelude.children.map(mediaQuery => {
            mediaQuery.children = mediaQuery.children.map(node => {
                if (node.type === NodeTypes.MediaFeature) {
                    node.value = processExpression(node.value, context)
                }
                return node;
            })
            return mediaQuery;
        })
        node.block = dispatchStatement(node.block, context)
        return node
    }

    function transformKeyframes(node: Keyframes, context: TransformContext): Keyframes {
        node.prelude.children = node.prelude.children.map((keyframesPreludeChild) => {

            if (keyframesPreludeChild.type === NodeTypes.VAR_KEY) {
                keyframesPreludeChild = processExpression(keyframesPreludeChild, context)
            }

            return keyframesPreludeChild;
        })

        node.block = dispatchStatement(node.block, context)
        return node;
    }

    function transformAtRule(node: Atrule, context: TransformContext) {
        if (node.name === 'media') {
            return transformMedia(node as MediaStatement, context);
        } else if (isKeyframesName(node.name)) {
            return transformKeyframes(node as Keyframes, context)
        }
    }

    /**
     * any expressions separated with spaces or commas count as a list
     */
    function transformEach(node: EachStatement, context: TransformContext) {
        let restoredContext = deepClone(node),
            right = processExpression(restoredContext.right, context),
            scope = context.env.extend(),
            list: string[] = [];

        if (right.type === NodeTypes.TEXT) {
            list = right.value.split(/,|\s+/).filter(val => val !== '')
        }

        let children = list.map(val => {
            /**
             * restore context with iterate multiple times
             */

            restoredContext = deepClone(node);

            scope.def(restoredContext.left.value, val);

            return dispatchStatement(restoredContext.body, { ...context, env: scope })
        })

        /**
         * return a created an empty selector RULE whose children will be flattened in transform_nest
         */
        return createRuleStatement(
            createSelectorNode(createTextNode('')),
            children,
            node.loc
        );
    }

    /**
     * context will be restored with function 
     */
    function transformIf(node: IfStatement, context: TransformContext) {

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
     * transform @mixin/@function -> set to env -> delete @mixin ast
     */
    function transformMixnOrFunction(node: MixinStatement | FunctionStatement, context: TransformContext) {

        function make_function() {

            /**
             * deep clone function statement to restore context when called multiple times
             */

            let restoredContext: MixinStatement | FunctionStatement = deepClone(node),
                params = restoredContext.params,
                scope = context.env.extend();

            function handle_params_default_value(params) {
                return params.map((param) => {
                    let ret = param;
                    if (param.type === NodeTypes.DECLARATION) {
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

            if (node.type === NodeTypes.FUNCTION) {
                dispatchStatement(restoredContext.body, { ...context, env: scope })
                return scope.get('@return', NodeTypes.RETURN)
            } else if (node.type === NodeTypes.MIXIN) {
                return dispatchStatement(restoredContext.body, { ...context, env: scope });
            }

        }

        context.env.def(node.id.value, make_function, node.type)

        return createEmptyNode();
    }

    /**
    * @return only be evaluated in a @function body
    */
    function transformReturn(node: ReturnStatement, context: TransformContext) {
        let result: TextNode = processExpression(node.argument, context);

        context.env.def('@return', result.value, node.type);
        return createEmptyNode();
    }

    function transformContent(context: TransformContext) {
        return context.env.get('@content', NodeTypes.CONTENT)
    }

    function transformInclude(node: IncludeStatement, context: TransformContext) {
        let func = context.env.get(node.id.value, NodeTypes.MIXIN);

        node.content && context.env.def('@content', dispatchStatement(node.content, context), NodeTypes.CONTENT)

        return callFunctionWithArgs(func, node, context) // call mixin which will use just defined @content if mixin contains
    }

    function transformChildOrBody(node: RuleStatement | BodyStatement, context: TransformContext): RuleStatement | BodyStatement {
        function flatten_included_body(children: Statement[]): Statement[] {
            let arr: Statement[] = []
            children.forEach(child => {
                if (child.type === NodeTypes.BODY) {
                    arr = arr.concat(flatten_included_body(child.children as Statement[]))
                } else {
                    arr.push(child)
                }
            })
            return arr;
        }

        let scope = context.env;

        /**
         * only extend a new child env when evaluate css child, but in program body, we do not extend
         */
        if (node.type === NodeTypes.RULE) {
            scope = context.env.extend();
        }

        node.children = (node.children as Statement[]).map(child => dispatchStatement(child, { ...context, env: scope })).filter(node => !isEmptyNode(node));

        if (node.type === NodeTypes.RULE) { // have selector
            if (node.selector.value.type === NodeTypes.LIST) {
                node.selector.value = processExpression(node.selector.value, { ...context, env: scope })
            }
        }

        /**
         *
         * @include include_function_body
         * @if which contain bodyStatement
         */
        node.children = flatten_included_body(node.children as Statement[]);

        return node;
    }

    return dispatchStatement(node, context)
}