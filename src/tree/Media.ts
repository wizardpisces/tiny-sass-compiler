import { RuleStatement, MediaStatement, createMediaStatement, createMediaFromRule, NodeTypes, MediaPrelude, MediaQuery } from "../parse/ast";
import { CodegenContext } from '@/type';
import { Rule } from '.';

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

        function genMediaQueryPrelude(node: MediaPrelude) {
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

        context.push('@media')
        genMediaQueryPrelude(node.prelude)
        genChildrenIterator(node.block.children as RuleStatement[], context)
    }
}

function genChildrenIterator(children: RuleStatement[], context: CodegenContext) {
    const { push, deindent, indent, newline } = context;
    push('{');
    indent();

    children.forEach((child: RuleStatement, index: number) => {
        new Rule(child).genCSS(context)
    })
    deindent();
    push('}');
    newline();
}