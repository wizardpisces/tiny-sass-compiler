import { RuleStatement, MediaStatement, createMediaStatement, createMediaFromRule, NodeTypes } from "../parse/ast";

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

    genCss() {

    }
}