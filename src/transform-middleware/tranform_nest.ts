
/**
 *
 * ast => ast
 * transform nested sass ast to flattened css ast
 * 
 */
import {
    NodeTypes,
    ChildStatement,
    TextNode,
    RootNode
} from '@/parse/ast';
import { createEmptyNode } from '../parse/util';

export default function tranform_nest(ast:RootNode) {
    function flatten_child(child: ChildStatement, arr: ChildStatement[] = []):ChildStatement[] {

        function flatten(child: ChildStatement, parentSelector = '') {

            /**
             * https://sass-lang.com/documentation/style-rules/parent-selector
             * support parent selector with loosening restriction
             */
            
            let containParentSelector = false;
            let selector: TextNode = child.selector as TextNode;
            if (selector.value.indexOf('&')>=0){
                containParentSelector = true;
                selector.value = selector.value.replace(/&/, parentSelector)
            }

            if (!containParentSelector){
                selector.value = (parentSelector + ' ' + selector.value).trim()
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
                    child.children.splice(index, 1,createEmptyNode())
                    flatten(exp, selector.value)
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