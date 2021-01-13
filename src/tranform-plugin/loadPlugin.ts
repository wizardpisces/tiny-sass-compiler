import { PluginStatement, createEmptyNode, EmptyNode } from '../parse/ast';
import path from 'path'
import { TransformContext } from '@/type';

const EXTNAME_GLOBAL = '.js'
export function loadPlugin(node: PluginStatement, context: TransformContext): EmptyNode {
    const { filename = './', env } = context;
    let filenameRelative = node.value.value,
        extname = path.extname(filenameRelative),
        basename = path.basename(filenameRelative),
        dirname = path.dirname(filenameRelative),

        /**
         * path.join generate: test/plugin/my-plugin which cannot be required by node
         * path.resolve generate: /Users/.../test/plugin/my-plugin which can be required by node
         */
        resolvedFilePath = path.resolve(path.dirname(filename), dirname, basename + (extname ? '' : EXTNAME_GLOBAL));

    require(resolvedFilePath).install(env)

    return createEmptyNode()
}