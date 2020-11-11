import { DeclarationStatement, TextNode } from "../parse/ast";
import { CodegenContext } from '@/type';
import Text from './text';

// type params = Parameters<typeof createSelectorNode>

export default class Declaration {
    declarationStatement: DeclarationStatement
    constructor(node: DeclarationStatement) {
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