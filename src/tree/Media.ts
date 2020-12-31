import { RuleStatement, MediaStatement, createMediaStatement, createMediaFromRule, NodeTypes, MediaQuery } from "../parse/ast";
import { Tree } from './tree';

type params = Parameters<typeof createMediaStatement>

export default class Media extends Tree{
    mediaStatement: MediaStatement
    constructor(mediaPrelude: params[0] | RuleStatement | RuleStatement[] | MediaStatement, body?: params[1]) {
        super()
        if (mediaPrelude.length || (mediaPrelude as RuleStatement).type === NodeTypes.RULE) { // create from rules
            // mediaPrelude.type === NodeTypes.RULE
            this.mediaStatement = createMediaFromRule(mediaPrelude as RuleStatement[])
        } else if (body) {
            this.mediaStatement = createMediaStatement(mediaPrelude as params[0], body as params[1])
        } else {
            this.mediaStatement = mediaPrelude as MediaStatement
        }
    }

    toJSON() {
        return this.mediaStatement
    }

    accept(visitor) {

    }
}

export function mergeMediaWithSamePrelude(...mediaList: MediaStatement[]): MediaStatement {

    mediaList[0].block.children = mediaList.reduce(
        (children: MediaStatement['block']['children'], media: MediaStatement) =>
            children.concat(media.block['children'])
        , [])

    return createMediaStatement(mediaList[0].prelude, mediaList[0].block)
}

export function isSameMediaPrelude(prelude1: MediaStatement['prelude'], prelude2: MediaStatement['prelude']): Boolean {
    if (prelude1.children.length !== prelude2.children.length) {
        return false
    }

    return prelude1.children.every((mediaQuery: MediaQuery, index: number) => {
        return mediaQuery === prelude2.children[index]
    })
}
