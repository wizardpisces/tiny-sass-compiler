
/**
 *
 * ast => ast
 * transform nested sass ast to flattened css ast
 * 
 */
import {
    NodeTypes
} from '../parser/ast';

module.exports = function tranform_nest(ast) {
    function flatten_child(child, arr = []) {

        function flatten(child, parentSelector = '') {

            /**
             * https://sass-lang.com/documentation/style-rules/parent-selector
             * support parent selector with loosening restriction
             */
            
            let containParentSelector = false;

            if(child.selector.value.indexOf('&')>=0){
                containParentSelector = true;
                child.selector.value = child.selector.value.replace(/&/, parentSelector)
            }

            if (!containParentSelector){
                child.selector.value = (parentSelector + ' ' + child.selector.value).trim()
            }
            
            /**
             * 清理空的选择器
              */
            child.selector.value  && arr.push(child);

            /**
             * 
              */
            child.children.forEach((exp, index) => {
                if (exp.type === NodeTypes.CHILD) {
                    child.children.splice(index, 1,{type:'empty'})
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
            if (exp.type === NodeTypes.CHILD) {
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