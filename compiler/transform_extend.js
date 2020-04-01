/**
 * 
 * @param {ast => ast} ast 
 * compile @extend
 */

module.exports =function transform_extend(ast) {
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
        return exp.type === 'placeholder';
    }

    function rm_empty_child(exp) {
        return exp.type === 'child' && (is_placeholder(exp.selector) || exp.children.length === 0) ? null : exp
    }

    function collect_extend(exp) {
        function collect(child) {
            child.children = child.children.map(exp => {
                if (exp.type === '@extend') {
                    extendSelectorPair[exp.param.value] = (extendSelectorPair[exp.param.value] || []).concat(child.selector.value)
                    return null;
                }
                return exp;
            }).filter(exp => exp !== null)

            return child;
        }
        return exp.type === 'child' ? collect(exp) : exp;
    }

    function transform_extend(exp) {
        function transform(child) {
            if (is_placeholder(child.selector)) {
                child.selector = {
                    type: 'str',
                    value: extendSelectorPair[child.selector.value].join(',')
                }
            } else {
                child.selector = {
                    type: 'str',
                    value: extendSelectorPair[child.selector.value].concat(child.selector.value).join(',')
                }
            }
            return child;
        }
        return exp.type === 'child' && extendSelectorPair[exp.selector.value] ? transform(exp) : exp;
    }

    function toplevel(ast) {

        ast.prog = ast.prog.map(exp => collect_extend(exp))
        ast.prog = ast.prog.map(exp => transform_extend(exp))
        ast.prog = ast.prog.map(exp => rm_empty_child(exp)).filter(exp => exp !== null)
        return ast;
    }

    return toplevel(ast);
}