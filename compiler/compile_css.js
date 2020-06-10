
/**
 * 
 * ast => css
 * 
 */
const NodeTypes = require('../parser/ast');

function compile_css(ast) {

    function compile(exp) {
        switch (exp.type) {
            case NodeTypes.TEXT: return css_str(exp);
            case NodeTypes.VARIABLE: return css_var(exp);
            case "assign": return css_assign(exp);
            case "child": return css_child(exp);
            case "empty": return '';

            default:
                throw new Error("Don't know how to compile expression for " + JSON.stringify(exp));
        }
    }

    function css_str(exp) {
        return exp.value;
    }

    function css_var(exp) {
        return exp.value;
    }

    function css_assign(exp) {
        return compile(exp.left) + ':' + compile(exp.right) + ';';
    }

    function css_child(exp) {
        return exp.selector.value + '{' + exp.children.map(child => compile(child)).join('') + '}';
    }

    function toplevel(ast) {
        return ast.prog.map(exp => compile(exp)).join('');
    }

    return toplevel(ast);
}

module.exports = compile_css