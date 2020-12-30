import { CodegenNode, NodeTypes, RootNode } from './parse/ast'

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
        [key in NodeTypes]?: Function
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

export function cloneContext(context:TraverseContext){
    let contextCloned: TraverseContext = {
       ...context
    }
    return contextCloned;
}

class PluginManager {
    _enterWalkers: Set<PluginFn>
    _enterVisitors: Set<PluginVisitor>
    _leaveWalkers: Set<PluginFn>
    constructor() {
        this._enterWalkers = new Set()
        this._leaveWalkers = new Set()
        this._enterVisitors = new Set()
    }

    public resetPlugin(){
        this._enterWalkers = new Set()
        this._leaveWalkers = new Set()
        this._enterVisitors = new Set()
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
            this.addEnterVisitor(plugin as PluginVisitor)
        } else {
            addPluginObject.call(this, plugin as PluginObject)
        }
    }

    addEnterWalker(walker: PluginFn) {
        this._enterWalkers.add(walker)
    }

    addEnterVisitor(walker: PluginVisitor) {
        this._enterVisitors.add(walker)
    }

    addLeaveWalker(walker: PluginFn) {
        this._enterWalkers.add(walker)
    }

   
    walkAtrule(node: CodegenNode, context: TraverseContext) { // use uniform traverse to both generate code and complete traverse visitor
        // node.block.children.forEach((childNode: any) => {
        //     this._walk(childNode, node)
        // })
        // this._walk(node.MediaPrelude, node);
        console.warn('[walkAtrule]:Todos...')
    }

    traverseChildren(
        parent: CodegenNode,
        context: TraverseContext
    ) {
        let i = 0
        const nodeRemoved = () => {
            i--
        }
        for (; i < parent.children.length; i++) {
            const child = parent.children[i]
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

        this.runEnterWalkers(oldContext);

        switch(node.type){
            case NodeTypes.RootNode:
                this.traverseChildren(node, context);
                break;
            case NodeTypes.RULE:
                this.traverseChildren(node, context)
                this.traverseNode(node.selector, context);
                break
        }

        // if (node.type === NodeTypes.Atrule) {
        //     this.walkAtrule(node, context)
        // }

        this.runLeaveWakers(oldContext)
    }

    runEnterWalkers(context:TraverseContext) {
        this._enterVisitors.forEach((visitor: PluginVisitor) => {
            let nodeType = (context.currentNode as CodegenNode).type
            if (typeof visitor.visitor[nodeType] === 'function') {
                (visitor.visitor[nodeType] as Function)(context)
            }
        })

        this._enterWalkers.forEach((walker) => {
            walker(context)
        })
    }

    runLeaveWakers(context:TraverseContext) {
        this._leaveWalkers.forEach((walker: PluginFn) => {
            walker(context)
        })
    }
}

let pluginManager = new PluginManager();

// provide open traverse on ast for custom data collection
export function walk(ast: RootNode, plugin: Plugin) {
    return pluginManager.walk(ast, plugin)
}

export function resetPlugin() {
    pluginManager = new PluginManager();
}

// provide open plugin registration
export function registerPlugin(plugin: Plugin) {
    return pluginManager.registerPlugin(plugin)
}

// provide open execution of plugins
export function applyPlugins(ast: RootNode) {
    return pluginManager.applyPlugins(ast)
}