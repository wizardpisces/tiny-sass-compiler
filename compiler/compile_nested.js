
/**
 *
 * ast => ast
 * transform nested sass ast to flattened css ast
 * 
 */

function compile_nested(ast) {
    function flatten_child(child, arr = []) {

        function flatten(child, parentSelector = '') {
            child.selector.value = (parentSelector + ' ' + child.selector.value).trim()
            arr.push(child);
            child.children.forEach((exp, index) => {
                if (exp.type === 'child') {
                    child.children.splice(index, 1)
                    flatten(exp, child.selector.value)
                }
            });
            return arr;
        }

        return flatten(child)
    }

    function toplevel(ast) {

        let prog = [];

        ast.prog.forEach(exp => {
            if (exp.type === 'child') {
                prog = prog.concat(...flatten_child(exp))
            } else {
                prog.push(exp)
            }
        });

        ast.prog = prog;

        return ast;
    }

    return toplevel(ast)
}

module.exports = compile_nested;