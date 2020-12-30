import { DeclarationStatement, TextNode } from "../parse/ast";
import { CodegenContext } from '@/type';
import Text from './text';
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

    genCSS(context: CodegenContext) {
        let node = this.declarationStatement;
        const { push } = context;
        
        new Text(node.left as TextNode).genCSS(context)
        push(':')
        new Text(node.right as TextNode).genCSS(context)
        push(';');
    }
}