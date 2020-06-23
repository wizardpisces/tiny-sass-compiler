import parse from './parse'
import transform from './transform'
import {
    NodeTypes
} from './parse/ast';
/**
 * 
 * ast => css
 * 
 */
function compile_css(ast) {

    function compile(exp) {
        switch (exp.type) {
            case NodeTypes.TEXT:
                return css_str(exp);
            case NodeTypes.VARIABLE:
                return css_var(exp);
            case NodeTypes.ASSIGN:
                return css_assign(exp);
            case NodeTypes.CHILD:
                return css_child(exp);
            case NodeTypes.EMPTY:
                return '';

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

export default (scss, sourceDir) => compile_css( transform( parse(scss), sourceDir ) )