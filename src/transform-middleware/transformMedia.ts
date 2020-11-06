
/**
 *
 * buble @media
 * 
 */
import {
    RootNode,
    NodeTypes,
    Node,
    createRuleFromMedia,
    SelectorNode,
    MediaStatement,
    RuleStatement,
    createMediaFromRule
} from '../parse/ast';

function propagateMediaDown(ast: RootNode) {
    function joinMeta(meta1: SelectorNode['meta'], meta2: SelectorNode['meta']) {
        return meta1.concat(meta2)
    }
    function traverseChildren(children: Node[], parentSelectorMeta: SelectorNode['meta']) {
        children.forEach((child, index) => {
            if (child.type === NodeTypes.RULE) {
                child.selector.meta = joinMeta(child.selector.meta, parentSelectorMeta)
                traverseChildren(child.children, child.selector.meta.slice())
            } else if (child.type === NodeTypes.AtRule && child.name === 'media') {
                let newRule:RuleStatement = createRuleFromMedia(child as MediaStatement)
                newRule.selector.meta = joinMeta(newRule.selector.meta, parentSelectorMeta)
                children.splice(index, 1, newRule) // replace media with newRule
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
            console.log('------------------newRule------', JSON.stringify(child))
            let newMedia:MediaStatement = createMediaFromRule(child)
            // console.log('------------------newmedia------',JSON.stringify(newMedia))
            ast.children.splice(index,1,newMedia)
        }
    })
}

export {
    propagateMediaDown,
    extractMediaUp
}