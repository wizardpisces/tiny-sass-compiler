import { RootNode } from '../parse/ast';
import { TransformContext } from '../type';
import { loadUseModuleByAst } from '../css-module/module';

export function  transformUseModule(root: RootNode, context: TransformContext){
    loadUseModuleByAst(root,context)
}