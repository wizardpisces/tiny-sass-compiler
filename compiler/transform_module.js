
/**
 *
 * ast => ast
 * replace @import to real ast
 * 
 */
const fs = require('fs')
const parser = require('../parser')
const path = require('path');
import {
    NodeTypes
} from '../parser/ast';
const EXTNAME_GLOBAL = '.scss'
module.exports = function transform_module(ast,context = './') {
    let importedAstList = [],
        newProg = [];
    /**
     * Todos
     * only support @import in the head lines for now
      */

    ast.prog = ast.prog.map(exp=>{
        if(exp.type === NodeTypes.IMPORT){
            importedAstList = importedAstList.concat(exp.params.map(exp=>{
                let filename = exp.value,
                    extname = path.extname(filename),
                    basename = path.basename(filename),
                    dirname = path.dirname(filename),
                    filePath = path.join(context, dirname, '_' + basename + (extname ? '' : EXTNAME_GLOBAL) );

                return parser(fs.readFileSync(filePath,'utf8'))
            }))
            return null
        }
        return exp;
    }).filter(exp=>exp!==null)

    importedAstList.forEach(ast=>{
        newProg = newProg.concat(ast.prog)
    })

    ast.prog = newProg.concat(ast.prog);

    return ast;
}