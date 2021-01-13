import fs from 'fs'
import parse from '../parse'
import { TransformContext, ParserOptions } from '../type'
import { RootNode, Statement, TextNode, NodeTypes, ImportStatement } from '../parse/ast'
import { Module } from './use/loader'


export function loadUseModuleByAst(root: RootNode, context: TransformContext) {
    // const { filePath } = context;
    root.children = root.children.filter(statement => statement.type === NodeTypes.USE)
    
    // Module._load(filePath, null)
}

export function loadImportModuleByAst(root: RootNode, context: TransformContext) {
    let statementList: RootNode['children'] = [];

    /**
     * Todos
     * only support @import in the head lines for now
     * 
     *  depth/left first walk import module, push child module children before parent module child
     */
    function walkNode(root: RootNode) {


        function requireModule(module: ImportStatement, parent: RootNode) {
            module.params.forEach((param: TextNode) => {
                let filename = param.value,
                    filePath = Module._resolveFilename(filename, context.filename),
                    source = fs.readFileSync(filePath, 'utf8'),
                    parseOptions: ParserOptions = {
                        filename: filePath,
                        source
                    };

                let childRootNode: RootNode = parse(source, parseOptions)


                walkNode(childRootNode)

                // collect source map file in module
                Object.assign(parent.fileSourceMap, childRootNode.fileSourceMap)
            })
        }

        root.children.forEach((statement) => {
            if (statement.type === NodeTypes.IMPORT) {
                requireModule(statement, root)
            } else {
                statementList.push(statement as Statement)
            }
        })
    }

    walkNode(root)

    root.children = statementList;
}