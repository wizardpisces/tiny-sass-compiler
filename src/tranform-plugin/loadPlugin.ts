import { PluginStatement, createEmptyNode, EmptyNode } from '../parse/ast';
import path from 'path'
import { TransformContext } from '@/type';

const EXTNAME_GLOBAL = '.js'
export function loadPlugin(node: PluginStatement, context: TransformContext): EmptyNode {
    const { filePath = './', env } = context;
    let filename = node.value.value,
        extname = path.extname(filename),
        basename = path.basename(filename),
        dirname = path.dirname(filename),

        /**
         * path.join generate: test/plugin/my-plugin which cannot be required by node
         * path.resolve generate: /Users/.../test/plugin/my-plugin which can be required by node
         */
        resolvedFilePath = path.resolve(path.dirname(filePath), dirname, basename + (extname ? '' : EXTNAME_GLOBAL));

    require(resolvedFilePath).install(env)

    return createEmptyNode()
}