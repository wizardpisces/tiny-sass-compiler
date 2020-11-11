import { SelectorNode } from "../parse/ast";
import { CodegenContext } from '@/type';

// type params = Parameters<typeof createSelectorNode>

export default class Selector {
    selectorNode: SelectorNode
    constructor(selectorNode: SelectorNode) {
        this.selectorNode = selectorNode;
    }

    toJSON() {
        return this.selectorNode
    }

    genCSS(context: CodegenContext) {
        let node = this.selectorNode;
        try {
            context.push(node.value.value as string, node.loc)
        } catch (e) {
            console.log('*********** genSelector **************', e)
        }
    }
}