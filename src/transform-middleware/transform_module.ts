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
    NodeTypes, 
    RootNode, 
    TextNode, 
    Statement, 
    ImportStatement
} from '../parse/ast';
import { ParserOptions } from '@/options';

const EXTNAME_GLOBAL = '.scss'
export default function transform_module(rootNode: RootNode, options) {
    const {sourceDir = './'} = options;
    let statementList :Statement[] = [];

    /**
     * Todos
     * only support @import in the head lines for now
     * 
     *  depth/left first walk import module, push child module children before parent module child
     */
    function walkNode(rootNode: RootNode){

       
        function importModule(module:ImportStatement, parent:RootNode){
            module.params.forEach((param: TextNode) => {
                let filename = param.value,
                    extname = path.extname(filename),
                    basename = path.basename(filename),
                    dirname = path.dirname(filename),
                    filePath = path.join(sourceDir, dirname, '_' + basename + (extname ? '' : EXTNAME_GLOBAL)),
                    source = fs.readFileSync(filePath, 'utf8'),
                    fileSourceMap:ParserOptions = {
                        filename,
                        source
                    };

                let childRootNode: RootNode = parse(source, fileSourceMap)

                // collect source map file in module
                
                walkNode(childRootNode)

                Object.assign(parent.fileSourceMap, childRootNode.fileSourceMap)
            })
        }

        rootNode.children.forEach((statement) => {
            if (statement.type === NodeTypes.IMPORT) {
                importModule(statement, rootNode)
            }else{
                statementList.push(statement as Statement)
            }
        })
    }

    walkNode(rootNode)

    rootNode.children = statementList;

    return rootNode
}