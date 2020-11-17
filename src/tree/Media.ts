import { RuleStatement, MediaStatement, createMediaStatement, createMediaFromRule, NodeTypes, MediaPrelude, MediaQuery } from "../parse/ast";
import { CodegenContext } from '@/type';
import { genChildrenIterator } from './util'

type params = Parameters<typeof createMediaStatement>

export default class Media {
    mediaStatement: MediaStatement
    constructor(mediaPrelude: params[0] | RuleStatement | MediaStatement, body?: params[1]) {
        if (mediaPrelude.type === NodeTypes.RULE) {
            this.mediaStatement = createMediaFromRule(mediaPrelude)
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

    genCSS(context: CodegenContext) {
        let node = this.mediaStatement;

        context.push('@media ')
        genMediaQueryPrelude(node.prelude, context)
        genChildrenIterator(node.block.children as RuleStatement[], context)
    }
}

function genMediaQueryPrelude(node: MediaPrelude, context: CodegenContext) {
    let prelude: string = node.children.map((mediaQuery: MediaQuery) => {
        return mediaQuery.children.map(child => {
            if (child.type === NodeTypes.MediaFeature) {
                return `(${child.name}:${child.value.value})`
            } else if (child.type === NodeTypes.TEXT) { // csstree name Identifier eg: screen , and etc
                return child.value
            }
        }).join(' ');
    }).join(',');

    context.push(prelude)
}
