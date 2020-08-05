import { NodeTransform, TransformContext } from '../transform'
import { NodeTypes, AssignStatement} from '../parse/ast'
import { processExpression } from './transformExpression'
import { createEmptyNode } from '../parse/util'

export const transformAssign: NodeTransform = (node, context) => {
    if (node.type === NodeTypes.ASSIGN){
        processAssign(node as AssignStatement, context)
    }
}

export const processAssign = (node:AssignStatement, context:TransformContext) => {

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