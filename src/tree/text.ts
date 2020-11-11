import { TextNode } from "../parse/ast";
import { CodegenContext } from '@/type';

// type params = Parameters<typeof createSelectorNode>

export default class Text {
    textNode: TextNode
    constructor(text: TextNode) {
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