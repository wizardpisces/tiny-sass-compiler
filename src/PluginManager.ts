import { CodegenNode, NodeTypes, RootNode, ProgCodeGenNode } from './parse/ast'

export type PluginContext = {
    remove(node: CodegenNode): void
    insert(node: CodegenNode): void
}

export type PluginFn = (node: CodegenNode, context: PluginContext) => void;

export type PluginObject = {
    enter?: PluginFn,
    leave?: PluginFn
}

export type Plugin = PluginFn | PluginObject

class PluginManager {
    _enterWalkers: Set<PluginFn> 
    _leaveWalkers: Set<PluginFn>
    _applied:boolean
    constructor() {
        this._enterWalkers = new Set()
        this._leaveWalkers = new Set()
        this._applied = false
    }

    _addEnterWalker(walker: PluginFn) {
        this._enterWalkers.add(walker)
    }

    _addLeaveWalker(walker: PluginFn) {
        this._enterWalkers.add(walker)
    }

    _walk(node: CodegenNode, list: CodegenNode[]) {
        this._runEnterWalkers(node, list)
        if (node.type === NodeTypes.RULE) {
            (node.children as CodegenNode[]).forEach((CHILDNode: CodegenNode, index: number) => {
                this._walk(CHILDNode, node.children as CodegenNode[])
            })
        }
        this._runLeaveWakers(node,list)
    }

    applyPlugins(ast:RootNode){
        if (this._applied){
            return;
        }else{
            this._applied = true;
        }

        (ast.children as ProgCodeGenNode[]).forEach((node: ProgCodeGenNode) => this._walk(node, ast.children as ProgCodeGenNode[]));
    }

    registerPlugin(plugin: Plugin) {
        if (typeof plugin === 'function') {
            return this._addEnterWalker(plugin)
        } else {
            plugin.enter && this._addEnterWalker(plugin.enter)
            plugin.leave && this._addLeaveWalker(plugin.leave)
        }
    }

    _createContext(visitedNode:CodegenNode, list: CodegenNode[]): PluginContext {
        return {
            remove(node: CodegenNode) {
                list.splice(list.indexOf(node),1)
            },
            insert(node: CodegenNode) {
                list.splice(list.indexOf(visitedNode) + 1, 0, node)
            }
        }
    }

    _runEnterWalkers(node: CodegenNode, list: CodegenNode[]) {
        this._enterWalkers.forEach(walker => walker.call(this, node, this._createContext(node, list)))
    }
    _runLeaveWakers(node: CodegenNode, list: CodegenNode[]) {
        this._leaveWalkers.forEach(walker => walker.call(this, node, this._createContext(node, list)))
    }
}

export const pluginManager = new PluginManager();

export function registerPlugin(plugin:Plugin){
    return pluginManager.registerPlugin(plugin)
}
export function applyPlugins(ast:RootNode){
    return pluginManager.applyPlugins(ast)
}