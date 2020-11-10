
/**
 *
 * buble @media
 * 
 */
import {
    RootNode,
    NodeTypes,
    Node,
    SelectorNode,
    MediaStatement,
    RuleStatement,
} from '../parse/ast';

import {
    Rule,
    Media
} from '../tree'

function propagateMediaDown(ast: RootNode) {

    function traverseChildren(children: Node[], parentSelectorMeta: SelectorNode['meta']) {
        children.forEach((child, index) => {
            if (child.type === NodeTypes.RULE) {
                child = new Rule(child as RuleStatement).addMeta(parentSelectorMeta).toJSON();
                traverseChildren(child.children, child.selector.meta.slice())
            } else if (child.type === NodeTypes.AtRule && child.name === 'media') {
                let newRule: RuleStatement = new Rule(child as MediaStatement).addMeta(parentSelectorMeta).toJSON()
                children.splice(index, 1, newRule) // replace media with newRule
                traverseChildren(newRule.children, newRule.selector.meta.slice())
            }
        })
    }

    traverseChildren(ast.children, [])
}

/**
 * 
 * @param ast
 * this phase ast contain only one level children
 */
function extractMediaUp(ast: RootNode) {
    ast.children.forEach((child, index) => {
        if (child.type === NodeTypes.RULE && child.selector.meta.length) { // contains media data
            let newMedia:MediaStatement = new Media(child).toJSON()
            ast.children.splice(index,1,newMedia)
        }
    })
}

export {
    propagateMediaDown,
    extractMediaUp
}