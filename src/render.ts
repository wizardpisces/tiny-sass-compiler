import fs from 'fs'
import baseCompile from './compile'
import { CompilerOptions, CodegenResult } from './type'

export type RenderOptions = {
    filename: string
}

export type RenderCallback = (err: null | Error, result: CodegenResult | null) => void

export function requireCSS(scssPath: string): CompilerOptions {
    return {
        source: fs.readFileSync(scssPath, 'utf8'),
        filename: scssPath
    }
}

export function render(options: RenderOptions, cb: RenderCallback) {
    try {
        let cssRequired = requireCSS(options.filename),
            result = baseCompile(cssRequired.source, cssRequired)
        cb(null, result)
    } catch (e) {
        cb(e, null)
    }
}

export function renderSync(options:RenderOptions){
    let cssRequired = requireCSS(options.filename),
        result = baseCompile(cssRequired.source, cssRequired)
    return result
}