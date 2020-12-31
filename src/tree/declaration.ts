import { DeclarationStatement } from "../parse/ast";
import { Tree } from './tree';

// type params = Parameters<typeof createSelectorNode>

export default class Declaration extends Tree{
    declarationStatement: DeclarationStatement
    constructor(node: DeclarationStatement) {
        super()
        this.declarationStatement = node;
    }

    toJSON() {
        return this.declarationStatement
    }
}