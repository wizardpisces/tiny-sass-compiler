/**
 * 
 * @param {ast => ast} ast 
 * compile @extend
 */
import {
    NodeTypes,
    RootNode
} from '../parse/ast';

export default function transform_extend(ast: RootNode) {
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
        return exp.type === NodeTypes.RULE && (is_placeholder(exp.selector.value) || exp.children.length === 0) ? null : exp
    }

    function collect_extend(exp) {
        function collect(rule) {
            rule.children = rule.children.map(exp => {
                if (exp.type === NodeTypes.EXTEND) {
                    extendSelectorPair[exp.param.value] = (extendSelectorPair[exp.param.value] || []).concat(rule.selector.value.value)
                    return null;
                }
                return exp;
            }).filter(exp => exp !== null)

            return rule;
        }
        return exp.type === NodeTypes.RULE ? collect(exp) : exp;
    }

    function transform_extend(exp) {
        function transform(rule) {
            if (is_placeholder(rule.selector.value)) {
                rule.selector = {
                    type: NodeTypes.TEXT,
                    value: extendSelectorPair[rule.selector.value.value].join(','),
                    loc: rule.selector.loc
                }
            } else {
                rule.selector = {
                    type: NodeTypes.TEXT,
                    value: extendSelectorPair[rule.selector.value.value].concat(rule.selector.value.value).join(','),
                    loc: rule.selector.loc
                }
            }
            return rule;
        }
        return exp.type === NodeTypes.RULE && extendSelectorPair[exp.selector.value.value] ? transform(exp) : exp;
    }

    function toplevel(ast) {

        ast.children = ast.children.map(exp => collect_extend(exp))
        ast.children = ast.children.map(exp => transform_extend(exp))
        ast.children = ast.children.map(exp => rm_empty_child(exp)).filter(exp => exp !== null)
        return ast;
    }

    return toplevel(ast);
}