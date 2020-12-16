
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
import { isEmptyNode } from '../parse/util';
import {
    broadcastMedia,
    bubbleAndMergeMedia
} from './transformMedia'

export default function tranformNest(ast: RootNode) {

    // DFS search
    function flatten_nested_rule(ruleNode: RuleStatement, arr: RuleStatement[] = []): RuleStatement[] {

        function flatten(ruleNode: RuleStatement, parentSelector: string = '') {

            /**
             * https://sass-lang.com/documentation/style-rules/parent-selector
             * support parent selector with loosening restriction
             */

            let containParentSelector = false;
            let selector: SelectorNode = ruleNode.selector as SelectorNode,
                selectorValue: TextNode = selector.value as TextNode; // after transform selector value will be TextNode

            if (selectorValue.value.indexOf('&') >= 0) { // & symbol stands for parentSelector
                containParentSelector = true;
                selectorValue.value = selectorValue.value.replace(/&/, parentSelector)
            }

            if (!containParentSelector) {
                selectorValue.value = (parentSelector + ' ' + selectorValue.value).trim()
            }

            /**
             * collect ruleNode reference before children traverse to keep flattened RuleStatement in order
            */
            arr.push(ruleNode);

            ruleNode.children.forEach((exp, index) => {
                if (exp.type === NodeTypes.RULE) {
                    // 动态替换掉即将被转换了的模块
                    ruleNode.children.splice(index, 1, createEmptyNode())
                    flatten(exp, selectorValue.value)
                }
            });

            /**
             * filter out empty node after all children traversed
             */

            ruleNode.children = ruleNode.children.filter(node => !isEmptyNode(node));
            ruleNode.children.length === 0 && arr.splice(arr.indexOf(ruleNode), 1)

            return arr;
        }

        return flatten(ruleNode)
    }

    function flattenNested(ast:RootNode){
        let children: RootNode["children"] = [];

        ast.children.forEach(exp => {
            if (exp.type === NodeTypes.RULE) {
                children = children.concat(...flatten_nested_rule(exp))
            } else if(exp.type === NodeTypes.BODY){
                children = children.concat(exp.children as RootNode["children"])
            } else {
                children.push(exp)
            }
        });

        ast.children = children
    }

    function toplevel(ast: RootNode) {
        // propagate media before flatten selector
        broadcastMedia(ast);

        flattenNested(ast)
        
        // extract after flatten selector and media
        bubbleAndMergeMedia(ast)

        return ast;
    }

    return toplevel(ast)
}