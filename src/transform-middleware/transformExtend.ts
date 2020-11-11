/**
 * 
 * @param {ast => ast} ast 
 * compile @extend
 */
import {
    NodeTypes,
    RootNode,
    createEmptyNode,
    createTextNode,
    createSelectorNode
} from '../parse/ast';
import { isEmptyNode } from '../parse/util';

export default function transformExtend(ast: RootNode) {
    /**
     * transform
     * 
     * .basic{}
     * .primary{
     *     @extend .basic;
     * }
     * 
     * to
     * 
     * {'.basic':['primary']}
     */
    let extendSelectorPair = {}

    function is_placeholder(exp) {
        return exp.type === NodeTypes.PLACEHOLDER;
    }

    function rm_empty_child(exp) {
        return exp.type === NodeTypes.RULE && (is_placeholder(exp.selector.value) || exp.children.length === 0) ? createEmptyNode() : exp
    }

    function collect_extend(exp) {
        function collect(rule) {
            rule.children = rule.children.map(exp => {
                if (exp.type === NodeTypes.EXTEND) {
                    extendSelectorPair[exp.param.value] = (extendSelectorPair[exp.param.value] || []).concat(rule.selector.value.value)
                    return createEmptyNode();
                }
                return exp;
            }).filter(exp => !isEmptyNode(exp))

            return rule;
        }
        return exp.type === NodeTypes.RULE ? collect(exp) : exp;
    }

    function transform_extend(exp) {
        function transform(rule) {
            if (is_placeholder(rule.selector.value)) {
                rule.selector = createSelectorNode(
                    createTextNode(
                        extendSelectorPair[rule.selector.value.value].join(','),
                        rule.selector.loc
                    )
                )

            } else {
                rule.selector = createSelectorNode(
                    createTextNode(
                        extendSelectorPair[rule.selector.value.value].concat(rule.selector.value.value).join(','),
                        rule.selector.loc
                    )
                )
            }
            return rule;
        }
        return exp.type === NodeTypes.RULE && extendSelectorPair[exp.selector.value.value] ? transform(exp) : exp;
    }

    function toplevel(ast) {

        ast.children = ast.children.map(exp => collect_extend(exp))
        ast.children = ast.children.map(exp => transform_extend(exp))
        ast.children = ast.children.map(exp => rm_empty_child(exp)).filter(exp => !isEmptyNode(exp))
        return ast;
    }

    return toplevel(ast);
}