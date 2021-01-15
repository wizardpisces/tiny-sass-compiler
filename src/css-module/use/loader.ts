import path from 'path'
import fs from 'fs'
import parse from '../../parse'
import { TransformContext, ParserOptions } from '../../type'
import { RootNode, NodeTypes, UseStatement, TextNode } from '../../parse/ast'
import { Environment } from '../../enviroment/Enviroment'
import { importModule } from '../import/importModule'
import { resolveSourceFilePath } from '../util'
import { isEmptyNode } from '../../parse/util'

function loadModule(module: Module, filename: string) {
    const source = fs.readFileSync(filename, 'utf8')
    module._compile(source)
}

function updateChildren(parent: Module | null, child: Module, scan:boolean = false) {
    const children = parent && parent.children;
    /**
     * create child and parent relationship
     * first time needs no scan
     */
    if (children && !(scan && children.includes(child))){
        children.push(child);
    }
}

function updateEnvAndSourceMap(module: Module | null) {
    if (module) {
        module.children.forEach((childModule: Module) => {
            /**
             * extend @use child namespace
             */
            module.exports.env.setEnvByNamespace(childModule.id, childModule.exports.env)
            Object.assign(module.ast.fileSourceMap, childModule.ast.fileSourceMap)
        })
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
    ast!: RootNode // css related CodegenNode[]
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
    static _load(id: string, parent: Module | null) {
        let filename = id, 
            module: Module = Module._cache[filename];

        if(!module){
            module = new Module(filename, parent)
            Module._cache[filename] = module
            module.load(filename)
        }else{
            updateChildren(parent, module, true)
        }
        /**
         * create scoped env to resolve namespaced variable
         */
        updateEnvAndSourceMap(module)

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
            env: new Environment(null)
        }

        /**
         * to both resolve @use and @import
         * @use must be used on top of the file
         * will _load child module
        */
        compatibleLoadModule(root, context, this);

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
    if (moduleCombinded.get(module)){
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

    function loadUseStatement(node: UseStatement) {
        node.params.forEach((param: TextNode) => {
            Module._load(resolveSourceFilePath(param.value, context.filename), parent)
        })
    }

    // load module entrance
    if (parent === null) {
        let module: Module = Module._load(context.filename, parent)
        /**
        * combine module after recursive loaded all children
        */
        root.children = combineModule(module)
        root.fileSourceMap = module.ast.fileSourceMap

    } else {
        root.children.forEach(node => {
            if (node.type === NodeTypes.USE) {
                loadUseStatement(node)
            }
        })
        root.children = root.children.filter(child => child.type !== NodeTypes.USE)
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

export function compatibleLoadModule(root: RootNode, context: TransformContext, parent: Module | null = null) {
    Module._context = context

    importModule(root, context)

    useModule(context, parent, root)
}