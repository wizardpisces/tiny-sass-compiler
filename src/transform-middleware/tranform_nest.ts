
/**
 *
 * ast => ast
 * transform nested sass ast to flattened css ast
 * 
 */
import {
    NodeTypes,
    RuleStatement,
    RootNode,
    SelectorNode,
    TextNode,
    createEmptyNode
} from '../parse/ast';

export default function tranform_nest(ast:RootNode) {
    function flatten_nested_rule(ruleNode: RuleStatement, arr: RuleStatement[] = []):RuleStatement[] {

        function flatten(ruleNode: RuleStatement, parentSelector:string = '') {

            /**
             * https://sass-lang.com/documentation/style-CHILDs/parent-selector
             * support parent selector with loosening restriction
             */
            
            let containParentSelector = false;
            let selector: SelectorNode = ruleNode.selector as SelectorNode,
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
            ruleNode.selector.value.value && arr.push(ruleNode);

            /**
             * 
              */
            ruleNode.children.forEach((exp, index) => {
                if (exp.type === NodeTypes.RULE) {
                    ruleNode.children.splice(index, 1,createEmptyNode())
                    flatten(exp, selectorValue.value)
                }
            });
            return arr;
        }

        return flatten(ruleNode)
    }

    function toplevel(ast:RootNode) {

        let children: RootNode["children"] = [];

        ast.children.forEach(exp => {
            if (exp.type === NodeTypes.RULE) {
                children = children.concat(...flatten_nested_rule(exp))
            } else {
                children.push(exp)
            }
        });

        ast.children = children;

        return ast;
    }

    return toplevel(ast)
}