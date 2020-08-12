/**
 * 
 * @param {ast => ast} ast 
 * compile @extend
 */
import {
    NodeTypes
} from '../parse/ast';

export default function transform_extend(ast) {
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
        return exp.type === NodeTypes.CHILD && (is_placeholder(exp.selector) || exp.children.length === 0) ? null : exp
    }

    function collect_extend(exp) {
        function collect(child) {
            child.children = child.children.map(exp => {
                if (exp.type === NodeTypes.EXTEND) {
                    extendSelectorPair[exp.param.value] = (extendSelectorPair[exp.param.value] || []).concat(child.selector.value)
                    return null;
                }
                return exp;
            }).filter(exp => exp !== null)

            return child;
        }
        return exp.type === NodeTypes.CHILD ? collect(exp) : exp;
    }

    function transform_extend(exp) {
        function transform(child) {
            if (is_placeholder(child.selector)) {
                child.selector = {
                    type: NodeTypes.TEXT,
                    value: extendSelectorPair[child.selector.value].join(','),
                    loc: child.selector.loc
                }
            } else {
                child.selector = {
                    type: NodeTypes.TEXT,
                    value: extendSelectorPair[child.selector.value].concat(child.selector.value).join(','),
                    loc: child.selector.loc
                }
            }
            return child;
        }
        return exp.type === NodeTypes.CHILD && extendSelectorPair[exp.selector.value] ? transform(exp) : exp;
    }

    function toplevel(ast) {

        ast.children = ast.children.map(exp => collect_extend(exp))
        ast.children = ast.children.map(exp => transform_extend(exp))
        ast.children = ast.children.map(exp => rm_empty_child(exp)).filter(exp => exp !== null)
        return ast;
    }

    return toplevel(ast);
}