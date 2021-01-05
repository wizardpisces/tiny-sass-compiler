/**
 * Applied only on codegen related AST
 * use case: genCodeVisitor which is used to gen dist css
*/
import { CodegenNode, NodeTypes, RootNode, MediaPrelude, MediaStatement, KeyframesPrelude, Keyframes } from './parse/ast'
import { isKeyframesName } from './parse/util';

export type TraverseContext = {
    parent: CodegenNode | null
    childIndex: number
    currentNode: CodegenNode | null
    onNodeRemoved(): void
    removeNode(): void
    insertNode(node: CodegenNode): void
    replaceNode(node: CodegenNode): void
}

export type PluginFn = (context: TraverseContext) => void;

export type PluginObject = {
    enter?: PluginFn,
    leave?: PluginFn
}

export type PluginVisitor = {
    visitor: {
        [key in NodeTypes]?: Function | PluginObject
    }
}

export type Plugin = PluginFn | PluginObject | PluginVisitor

function createTraverseContext(): TraverseContext {
    const context: TraverseContext = {
        parent: null,
        childIndex: 0,
        onNodeRemoved: () => { },
        currentNode: null,
        removeNode(node?: CodegenNode) {
            /**
             * occupy place where node has been removed to ensure following correct iteration
             * set current Node as EmptyNode
             */
            const removalIndex = node
                ? context.parent!.children.indexOf(node)
                : context.currentNode
                    ? context.childIndex
                    : -1
            if (removalIndex < 0) {
                throw new Error(`node being removed is not a child of current parent`)
            }

            if (!node || node === context.currentNode) {
                // current node removed
                context.currentNode = null
                context.onNodeRemoved()
            } else {
                // sibling node removed
                if (context.childIndex > removalIndex) {
                    context.childIndex--
                    context.onNodeRemoved()
                }
            }
            context.parent!.children.splice(removalIndex, 1)
        },

        // Todos: insertAfter and insertBefore
        insertNode(node: CodegenNode) {
            context.parent!.children.splice(context.parent!.children.indexOf(context.currentNode) + 1, 0, node)
        },
        replaceNode(node: CodegenNode) {
            if (!context.parent) {
                throw new Error(`Cannot replace root node.`)
            }
            context.parent!.children[context.childIndex] = context.currentNode = node
        }
    }

    return context
}

export function cloneContext(context: TraverseContext) {
    let contextCloned: TraverseContext = {
        ...context
    }
    return contextCloned;
}

export class Traverse {
    enterPlugins: Set<PluginFn>
    visitorPlugins: Set<PluginVisitor>
    leavePlugins: Set<PluginFn>
    constructor() {
        this.enterPlugins = new Set()
        this.leavePlugins = new Set()
        this.visitorPlugins = new Set()
    }

    public walk(ast: RootNode, plugin) {
        this.registerPlugin(plugin)
        this.applyPlugins(ast)
    }

    public applyPlugins(ast: CodegenNode) {
        let context: TraverseContext = createTraverseContext()
        this.traverseNode(ast, context);
    }

    public registerPlugin(plugin: Plugin) {

        const addPluginObject = (pluginObj: PluginObject) => {
            pluginObj.enter && this.addEnterWalker(pluginObj.enter);
            pluginObj.leave && this.addLeaveWalker(pluginObj.leave);
        }

        if (typeof plugin === 'function') {
            return this.addEnterWalker(plugin)
        } else if ((plugin as PluginVisitor).visitor) {
            this.addVisitorPlugin(plugin as PluginVisitor)
        } else {
            addPluginObject.call(this, plugin as PluginObject)
        }
    }

    addEnterWalker(plugin: PluginFn) {
        this.enterPlugins.add(plugin)
    }

    addVisitorPlugin(plugin: PluginVisitor) {
        this.visitorPlugins.add(plugin)
    }

    addLeaveWalker(plugin: PluginFn) {
        this.leavePlugins.add(plugin)
    }

    traverseChildren(
        parent: CodegenNode,
        context: TraverseContext
    ) {
        let children = parent.children || parent.block.children,
            i = 0

        const nodeRemoved = () => {
            i--
        }
        for (; i < children.length; i++) {
            const child = children[i]
            context.parent = parent
            context.childIndex = i
            context.onNodeRemoved = nodeRemoved
            this.traverseNode(child, context)
        }
    }

    // depth fisrt search
    traverseNode(node: CodegenNode, context: TraverseContext) {
        context.currentNode = node
        let oldContext = cloneContext(context)

        this.runEnterPlugins(oldContext);

        switch (node.type) {
            case NodeTypes.RootNode:
                this.traverseChildren(node, context);
                break;
            case NodeTypes.RULE:
                // first traverse selector for codegen purpose
                this.traverseNode(node.selector, context);
                this.traverseChildren(node, context)
                break;
            case NodeTypes.Atrule:
                if (node.name === 'media') {
                    this.traverseNode(<MediaPrelude>node.prelude, context)
                    this.traverseChildren(<MediaStatement>node, context)
                } else if (isKeyframesName(node.name)) {
                    this.traverseNode(<KeyframesPrelude>node.prelude, context)
                    this.traverseChildren(<Keyframes>node, context)
                }
                break;
        }

        this.runLeavePlugins(oldContext)
    }

    runEnterPlugins(context: TraverseContext) {
        this.visitorPlugins.forEach((visitor: PluginVisitor) => {
            let nodeType = (context.currentNode as CodegenNode).type
            if (visitor.visitor[nodeType]) {
                if (typeof visitor.visitor[nodeType] === 'function') {
                    (visitor.visitor[nodeType] as Function)(context)
                } else if (typeof (visitor.visitor[nodeType] as PluginObject).enter === 'function') {
                    ((visitor.visitor[nodeType] as PluginObject).enter as Function)(context)
                }
            }
        })

        this.enterPlugins.forEach((plugin) => {
            plugin(context)
        })
    }

    runLeavePlugins(context: TraverseContext) {

        this.visitorPlugins.forEach((visitor: PluginVisitor) => {
            let nodeType = (context.currentNode as CodegenNode).type
            if (visitor.visitor[nodeType]) {
                if (typeof (visitor.visitor[nodeType] as PluginObject).leave === 'function') {
                    ((visitor.visitor[nodeType] as PluginObject).leave as Function)(context)
                }
            }
        })

        this.leavePlugins.forEach((plugin: PluginFn) => {
            plugin(context)
        })
    }
}




let traverseInstance = new Traverse();

export const traverse = {
    // provide open traverse on ast for custom data collection
    walk(ast: RootNode, plugin: Plugin) {
        traverseInstance.walk(ast, plugin)
        return traverse
    },

    resetPlugin() {
        traverseInstance = new Traverse();
        return traverse
    },

    // provide open plugin registration
    registerPlugin(plugin: Plugin) {
        traverseInstance.registerPlugin(plugin)
        return traverse
    },

    // provide open execution of plugins
    applyPlugins(ast: RootNode) {
        traverseInstance.applyPlugins(ast)
        return traverse
    }
}
