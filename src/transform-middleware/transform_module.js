
/**
 *
 * ast => ast
 * replace @import to real ast
 * 
 */
import fs from 'fs'
import parse from '../parse'
import path from 'path'
import {
    NodeTypes
} from '../parse/ast';
const EXTNAME_GLOBAL = '.scss'
export default function transform_module(ast, context = './') {
    let importedAstList = [],
        newProg = [];
    /**
     * Todos
     * only support @import in the head lines for now
      */

    ast.children = ast.children.map(exp=>{
        if(exp.type === NodeTypes.IMPORT){
            importedAstList = importedAstList.concat(exp.params.map(exp=>{
                let filename = exp.value,
                    extname = path.extname(filename),
                    basename = path.basename(filename),
                    dirname = path.dirname(filename),
                    filePath = path.join(context, dirname, '_' + basename + (extname ? '' : EXTNAME_GLOBAL) );

                return parse(fs.readFileSync(filePath,'utf8'))
            }))
            return null
        }
        return exp;
    }).filter(exp=>exp!==null)

    importedAstList.forEach(ast=>{
        newProg = newProg.concat(ast.children)
    })

    ast.children = newProg.concat(ast.children);

    return ast;
}