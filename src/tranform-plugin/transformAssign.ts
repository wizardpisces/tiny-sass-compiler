import { NodeTransform, TransformContext } from '../transform'
import { NodeTypes, DeclarationStatement, createEmptyNode} from '../parse/ast'
import { processExpression } from './transformExpression'

export const transformAssign: NodeTransform = (node, context) => {
    if (node.type === NodeTypes.DECLARATION){
        processAssign(node as DeclarationStatement, context)
    }
}

export const processAssign = (node:DeclarationStatement, context:TransformContext) => {

    if (node.left.type === NodeTypes.VARIABLE) {
        context.env.def(node.left.value, processExpression(node.right, context).value)
        return createEmptyNode();
    }

    if (node.left.type === NodeTypes.VAR_KEY) {
        node.left = processExpression(node.left, context);
    }

    node.right = processExpression(node.right, context);

    return node;
}