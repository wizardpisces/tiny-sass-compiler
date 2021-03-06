import path from 'path'
import fs from 'fs'
import parse from '../../parse'
import { TransformContext, ParserOptions } from '../../type'
import { RootNode, NodeTypes, UseStatement, TextNode, ForwardStatement } from '../../parse/ast'
import { Environment } from '../../enviroment/Enviroment'
import { importModule } from '../import/importModule'
import { resolveSourceFilePath, EXTNAME_GLOBAL, createModuleError } from '../util'
import { isEmptyNode } from '../../parse/util'

function createCircularReferenceChain(module: Module, parent: Module): string {
    let temp = parent,
        msg = [module.id, parent.id]
    while (temp && temp.id !== module.id) {
        temp = temp.parent as Module
        msg.push(temp.id)
    }

    return `\n -> ${msg.reverse().join('\n -> ')}`
}

function loadModule(module: Module, filename: string) {
    const source = fs.readFileSync(filename, 'utf8')
    module._compile(source)
}

function updateChildren(parent: Module | null, child: Module, scan: boolean = false) {
    const children = parent && parent.children;
    /**
     * create child and parent relationship
     * first time needs no scan
     */
    if (children && !(scan && children.includes(child))) {
        children.push(child);
    }
}

function updateEnvAndSourceMap(parent: Module | null, module: Module, type: NodeTypes.USE | NodeTypes.FORWARD = NodeTypes.USE) {

    function getPureName(filename: string) {
        let name = path.basename(filename, EXTNAME_GLOBAL);
        return name.indexOf('_') < 0 ? name : name.substring(1)
    }

    if (parent) {
        let name = getPureName(module.id);
        /**
         * extend @use child namespace
         */

        if (type === NodeTypes.USE) {
            parent.exports.env.setEnvByName(name, module.exports.env)
        } else if (type === NodeTypes.FORWARD) {
            parent.exports.env.addLookUpModuleChain(module.exports.env)
        }

        Object.assign(module.ast.fileSourceMap, module.ast.fileSourceMap)
    }
}

// const moduleParentCache = new WeakMap();
export class Module {
    static _cache = new Object(null)
    static _context: TransformContext
    static _extensions = {
        '.scss': loadModule
    }
    exports: {
        env: Environment,
        [key: string]: any
    } = {
            env: new Environment(null)
        }

    parent: null | Module = null
    id: string // path of the sourcefile
    loaded: boolean = false
    filename!: string
    children: Module[] = []
    ast!: RootNode // ast which has been compiled: interpreted, and before transform-middleware
    isMain: Boolean = false

    constructor(id: string = '', parent: Module | null = null) {
        this.id = id;
        // moduleParentCache.set(this, parent);
        this.parent = parent;
        this.filename = ''
        this.children = []
        this.isMain = parent === null
        updateChildren(parent, this, false);
    }

    /**
     * module entry point
     */
    static _load(id: string, parent: Module | null, type: NodeTypes.USE | NodeTypes.FORWARD = NodeTypes.USE): Module {
        let filename = id,
            module: Module = Module._cache[filename];

        if (!module) {
            module = new Module(filename, parent);
            /**
             * set cache before load complete for convenient circular reference check
             */
            Module._cache[filename] = module;
            module.load(filename)
        } else {
            /**
             * 1. cached
             * 2. not loaded
             * 3. present as current module
             */
            if (!module.loaded && parent) {
                createModuleError(`Circular reference: ${createCircularReferenceChain(module, parent)}`)
            }

            updateChildren(parent, module, true)
        }
        /**
         * create scoped env to resolve namespaced variable
         */
        updateEnvAndSourceMap(parent, module, type)

        return module
    }

    _compile(source: string) {
        /**
         * update ParserOptions in new module
         */
        let parseOptions: ParserOptions = { filename: this.filename, source },
            root = parse(source, parseOptions)

        /**
         * update TransformContext in new module
         */
        let context: TransformContext = {
            ...Module._context,
            root,
            filename: this.filename,
            env: this.exports.env
        }

        /**
         * resolve module both @use and @import
         * @use must be used on top of the file
         * when resolve @import this will concat child module children to root children for next interpret
        */
        compatibleLoadModule(context, this, root);

        /**
         * interpret variable , function , mixin etc
         */
        interpret(root, context);

        /**
         * root for combine module
         */
        this.ast = root;
        /**
         * modify exports for parent @use
         */
        this.exports.env = context.env
    }

    load(filename: string) {
        this.filename = filename
        const extname = path.extname(filename)

        /**
         * load file by extensions, support scss for now
         * could also used for @plugin ？
         */

        Module._extensions[extname](this, filename)

        this.loaded = true;
    }
}

const moduleCombinded = new WeakMap();
function combineModule(module: Module): RootNode['children'] {
    let root: RootNode = module.ast
    if (moduleCombinded.get(module)) {
        return []
    }
    moduleCombinded.set(module, true)
    /**
     * depth first concat
     */
    module.children.forEach((childModule: Module) => {
        root.children = combineModule(childModule).concat(root.children)
    })

    return root.children;
}

function useModule(context: TransformContext, parent: Module | null = null, root: RootNode) {

    function loadUseStatement(node: UseStatement | ForwardStatement) {
        node.params.forEach((param: TextNode) => {
            Module._load(resolveSourceFilePath(param.value, context.filename), parent, node.type)
        })
    }

    // load module entrance
    if (parent === null) {
        let rootModule: Module = Module._load(context.filename, parent)
        /**
        * combine module after recursive loaded all children
        */
        root.children = combineModule(rootModule)
        root.fileSourceMap = rootModule.ast.fileSourceMap

    } else {
        root.children = root.children.filter(child => {
            if (child.type === NodeTypes.USE || child.type === NodeTypes.FORWARD) {
                loadUseStatement(child)
            }
            return !(child.type === NodeTypes.USE || child.type === NodeTypes.FORWARD)
        })
    }
}

/**
 * interpret mainly covers variable | function | mixin interpretation 
 * also cover related transformation eg: @include ,@return ,@content ,@if ,@else ,@plugin ,@error ,@each
 */
export function interpret(root: RootNode, context: TransformContext) {
    const { nodeTransforms } = context

    root.children = root.children.map((child) => {
        for (let i = 0; i < nodeTransforms.length; i++) {
            child = nodeTransforms[i](child, context)
        }
        return child;
    }).filter((child) => !isEmptyNode(child))
}

export function compatibleLoadModule(context: TransformContext, parent: Module | null = null, root: RootNode) {
    /**
     * update context for later extend context
     */
    Module._context = context

    importModule(context, root)

    /**
     * exit when main module _load finished
     */
    useModule(context, parent, root)
}