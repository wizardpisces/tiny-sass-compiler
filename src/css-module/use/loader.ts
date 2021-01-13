import path from 'path'
import fs from 'fs'
import parse from '../../parse'
import { TransformContext } from '../../type'
import { NodeTypes } from '../../parse/ast'

const EXTNAME_GLOBAL = '.scss'

function loadModule(module: Module, filename: string) {
    const source = fs.readFileSync(filename, 'utf8')
    module._compile(source)
}

/**
 * reference node module structure
 */
function updateChildren(parent: Module | null, child: Module) {
    const children = parent && parent.children;
    if (children && !(children.includes(child)))
        children.push(child);
}

const moduleParentCache = new WeakMap();

export class Module {
    static _cache = new Object(null)
    static _context: TransformContext
    static _extensions = {
        '.scss': loadModule
    }

    parent: null | Module = null
    id: string // path of the sourcefile
    loaded: boolean = false
    filename!: string
    children: Module[] = []
    // context!: TransformContext
    constructor(id: string = '', parent: Module | null = null) {
        this.id = id;
        moduleParentCache.set(this, parent);
        updateChildren(parent, this);
        this.parent = parent;
        this.filename = ''
        this.children = []
    }

    static _resolveFilename(filename: string, parentPath = './') {
        let extname = path.extname(filename),
            basename = path.basename(filename),
            dirname = path.dirname(filename),
            parentPathDir = path.dirname(parentPath),
            filePath = path.join(parentPathDir, dirname, '_' + basename + (extname ? '' : EXTNAME_GLOBAL))

        return filePath
    }

    static _load(id: string, parent: Module | null) {
        const filename = Module._resolveFilename(id)

        const cacheModule = Module._cache[filename]

        if (cacheModule !== undefined) {
            return cacheModule
        }

        const module = new Module(filename, parent)

        Module._cache[filename] = module;

        module.load(filename)

        return module
    }

    _compile(source: string) {
        let root = parse(source, { filename: this.filename, source })
        root.children.filter(statement=>statement.type === NodeTypes.USE)
        // transform(ast)
    }

    require(id: string) {
        return Module._load(id, this)
    }

    load(filename: string) {
        this.filename = filename
        const extname = path.extname[filename]
        Module._extensions[extname](this, filename)
        this.loaded = true;
    }
}