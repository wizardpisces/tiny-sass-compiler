import { PluginStatement, createEmptyNode, EmptyNode } from '../parse/ast';
import path from 'path'
import { TransformContext } from '@/type';

const EXTNAME_GLOBAL = '.js'
export function loadPlugin(node: PluginStatement, context: TransformContext): EmptyNode {
    const { sourceDir = './', env } = context;
    let filename = node.value.value,
        extname = path.extname(filename),
        basename = path.basename(filename),
        dirname = path.dirname(filename),

        /**
         * path.join generate: test/plugin/my-plugin which cannot be required by node
         * path.resolve generate: /Users/.../test/plugin/my-plugin which can be required by node
         */
        filePath = path.resolve(sourceDir, dirname, basename + (extname ? '' : EXTNAME_GLOBAL));

    require(filePath).install(env)

    return createEmptyNode()
}