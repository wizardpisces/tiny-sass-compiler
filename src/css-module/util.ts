import path from 'path'
export const EXTNAME_GLOBAL = '.scss'

export function resolveSourceFilePath(filename: string, parentPath = './') {
    let extname = path.extname(filename),
        basename = path.basename(filename),
        dirname = path.dirname(filename),
        parentPathDir = path.dirname(parentPath),
        filePath = path.join(parentPathDir, dirname, '_' + basename + (extname ? '' : EXTNAME_GLOBAL))

    return filePath
}

export function createModuleError(msg){
    throw Error(`[ tiny-sass-compiler -> module ]: ${msg}`)
}