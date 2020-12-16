
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
    isSameMediaPrelude,
    mergeMediaWithSamePrelude,
} from '../tree/Media'

import {
    Rule,
    Media
} from '../tree'
import { isMediaNode } from '../parse/util';

export function broadcastMedia(ast: RootNode) {

    function traverseChildren(children: Node[], parentSelectorMeta: SelectorNode['meta']) {
        children.forEach((child, index) => {
            if (child.type === NodeTypes.RULE) {
                child = new Rule(child as RuleStatement).addMeta(parentSelectorMeta).toJSON();
                traverseChildren(child.children, child.selector.meta.slice())
            } else if (child.type === NodeTypes.Atrule && child.name === 'media') {
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
export function bubbleAndMergeMedia(ast: RootNode) {

    function bubbleMedia(ast:RootNode){
        ast.children.forEach((child, index) => {
            if (child.type === NodeTypes.RULE && child.selector.meta.length) { // contains media data
                let newMedia:MediaStatement = new Media(child).toJSON()
                ast.children.splice(index,1,newMedia)
            }
        })
    }

    function mergeMedia(ast:RootNode){
        let children: RootNode['children'] = []
        let prevMedia: MediaStatement | null = null;

        // merge consecutive media with the same prelude which breaked down from previous media broadcast and flatten
        ast.children.forEach(child => {
            if (isMediaNode(child)) {
                if (prevMedia) {
                    if (isSameMediaPrelude(prevMedia.prelude, child.prelude)) {
                        prevMedia = mergeMediaWithSamePrelude(prevMedia, child as MediaStatement)
                    } else {
                        children.push(prevMedia)
                        prevMedia = child as MediaStatement
                    }
                } else {
                    prevMedia = child as MediaStatement
                }
            } else {
                // collect previous merged media and reset prevMedia
                prevMedia && children.push(prevMedia) && (prevMedia = null)
                children.push(child)
            }

        })

        // resolve tailing media
        prevMedia && children.push(prevMedia)

        ast.children = children;
    }

    bubbleMedia(ast)
    mergeMedia(ast)

}