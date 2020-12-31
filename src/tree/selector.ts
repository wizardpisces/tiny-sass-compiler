import { SelectorNode } from "../parse/ast";
import { Tree } from './tree';

// type params = Parameters<typeof createSelectorNode>

export default class Selector extends Tree{
    selectorNode: SelectorNode
    constructor(selectorNode: SelectorNode) {
        super()
        this.selectorNode = selectorNode;
    }

    toJSON() {
        return this.selectorNode
    }
}