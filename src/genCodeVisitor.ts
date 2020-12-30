import { Plugin, TraverseContext } from './traverse';
import { NodeTypes, TextNode, SelectorNode, DeclarationStatement, MediaPrelude, MediaQuery, KeyframesPrelude, Atrule } from './parse/ast';
import { CodegenContext } from './type';
import { isEmptyNode, isKeyframesName } from './parse/util';

export function genCodeVisitor(context: CodegenContext): Plugin {
    return {
        visitor: {
            [NodeTypes.EMPTY]() {

            },

            [NodeTypes.TEXT]: {
                enter(ctx: TraverseContext) {
                    let node = <TextNode>ctx.currentNode
                    context.push((node).value, node.loc)
                }
            },
            [NodeTypes.SELECTOR]: {
                enter(ctx: TraverseContext) {
                    let node = <SelectorNode>ctx.currentNode;
                    try {
                        context.push(node.value.value as string, node.loc)
                    } catch (e) {
                        console.log('*********** genSelector **************', e)
                    }
                    context.push('{');
                    context.indent();
                }
            },
            [NodeTypes.DECLARATION]: {
                enter(ctx: TraverseContext) {
                    let node = <DeclarationStatement>ctx.currentNode;
                    if (ctx.childIndex && !isEmptyNode(node)) {
                        context.newline()
                    }
                    context.push(node.left.value, node.left.loc)
                    context.push(':')
                    context.push((node.right as TextNode).value, node.right.loc)
                    context.push(';');

                }
            },
            [NodeTypes.RULE]: {
                enter(ctx: TraverseContext) {
                },
                leave(ctx: TraverseContext) {
                    context.deindent();
                    context.push('}');
                    context.newline()
                },
            },
            [NodeTypes.KeyframesPrelude]: {
                enter(ctx: TraverseContext) {
                    let node = <KeyframesPrelude>ctx.currentNode;
                    context.push(node.children.map((child) => (child as TextNode).value).join(' '), node.loc)
                    context.push('{');
                    context.indent();
                }
            },
            [NodeTypes.MediaPrelude]: {
                enter(ctx: TraverseContext) {
                    let node = <MediaPrelude>ctx.currentNode
                    let prelude: string = node.children.map((mediaQuery: MediaQuery) => {
                        return mediaQuery.children.map(child => {
                            if (child.type === NodeTypes.MediaFeature) {
                                return `(${child.name}:${child.value.value})`
                            } else if (child.type === NodeTypes.TEXT) { // csstree name Identifier eg: screen , and etc
                                return child.value
                            }
                        }).join(' ');
                    }).join(',');

                    context.push(prelude)
                    context.push('{');
                    context.indent();
                }
            },
            [NodeTypes.Atrule]: {
                enter(ctx: TraverseContext) {
                    let node = <Atrule>ctx.currentNode;;
                    if (node.name === 'media') {
                        context.push('@media ')
                    } else if (isKeyframesName(node.name)) {
                        context.push(node.name + ' ')
                    }
                 
                   
                },
                leave(ctx: TraverseContext) {
                    context.deindent();
                    context.push('}');
                },
            }
        }
    }
}