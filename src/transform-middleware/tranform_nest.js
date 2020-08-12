
/**
 *
 * ast => ast
 * transform nested sass ast to flattened css ast
 * 
 */
import {
    NodeTypes
} from '../parse/ast';

export default function tranform_nest(ast) {
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
                    child.children.splice(index, 1,{type:NodeTypes.EMPTY})
                    flatten(exp, child.selector.value)
                }
            });
            return arr;
        }

        return flatten(child)
    }

    function toplevel(ast) {

        let children = [];

        ast.children.forEach(exp => {
            if (exp.type === NodeTypes.CHILD) {
                children = children.concat(...flatten_child(exp))
            } else {
                children.push(exp)
            }
        });

        ast.children = children;

        return ast;
    }

    return toplevel(ast)
}