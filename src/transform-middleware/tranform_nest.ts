
/**
 *
 * ast => ast
 * transform nested sass ast to flattened css ast
 * 
 */
import {
    NodeTypes,
    ChildStatement,
    RootNode,
    SelectorNode,
    TextNode,
    createEmptyNode
} from '../parse/ast';

export default function tranform_nest(ast:RootNode) {
    function flatten_child(child: ChildStatement, arr: ChildStatement[] = []):ChildStatement[] {

        function flatten(child: ChildStatement, parentSelector:string = '') {

            /**
             * https://sass-lang.com/documentation/style-rules/parent-selector
             * support parent selector with loosening restriction
             */
            
            let containParentSelector = false;
            let selector: SelectorNode = child.selector as SelectorNode,
                selectorValue:TextNode = selector.value as TextNode; // after transform selector value will be TextNode

            if (selectorValue.value.indexOf('&')>=0){
                containParentSelector = true;
                selectorValue.value = selectorValue.value.replace(/&/, parentSelector)
            }

            if (!containParentSelector){
                selectorValue.value = (parentSelector + ' ' + selectorValue.value).trim()
            }
            
            /**
             * 清理空的选择器
              */
            child.selector.value.value && arr.push(child);

            /**
             * 
              */
            child.children.forEach((exp, index) => {
                if (exp.type === NodeTypes.CHILD) {
                    child.children.splice(index, 1,createEmptyNode())
                    flatten(exp, selectorValue.value)
                }
            });
            return arr;
        }

        return flatten(child)
    }

    function toplevel(ast:RootNode) {

        let children: RootNode["children"] = [];

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