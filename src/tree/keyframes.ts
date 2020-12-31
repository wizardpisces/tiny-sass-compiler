import { Keyframes } from "../parse/ast";
import { Tree } from './tree';

// type params = Parameters<typeof createSelectorNode>

export default class KeyframesTree extends Tree{
    keyframes: Keyframes
    constructor(node: Keyframes) {
        super()
        this.keyframes = node;
    }

    toJSON() {
        return this.keyframes
    }
}