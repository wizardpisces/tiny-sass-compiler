import { TextNode } from "../parse/ast";
import { CodegenContext } from '@/type';
import { Tree } from './tree';

// type params = Parameters<typeof createSelectorNode>

export default class Text extends Tree{
    textNode: TextNode
    constructor(text: TextNode) {
        super()
        this.textNode = text;
    }

    toJSON() {
        return this.textNode
    }

    genCSS(context: CodegenContext) {
        let node = this.textNode;
        context.push(node.value, node.loc)
    }
}