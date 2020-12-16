import { Keyframes, TextNode, RuleStatement } from "../parse/ast";
import { CodegenContext } from '@/type';
import { genChildrenIterator } from './util'

// type params = Parameters<typeof createSelectorNode>

export default class KeyframesTree {
    keyframes: Keyframes
    constructor(node: Keyframes) {
        this.keyframes = node;
    }

    toJSON() {
        return this.keyframes
    }

    genCSS(context: CodegenContext) {
        let node = this.keyframes;

        context.push(node.name+' ')
        genPrelude(node.prelude, context)
        genChildrenIterator(node.block.children as RuleStatement[], context)
    }
}

function genPrelude(node:Keyframes['prelude'],context:CodegenContext){
    context.push(node.children.map((child) => (child as TextNode).value).join(' '),node.loc)
}
