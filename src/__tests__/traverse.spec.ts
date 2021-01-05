import { parse, transform, generate } from '../index'
import { NodeTypes, CodegenNode } from '../parse/ast'
import { traverse, TraverseContext, PluginVisitor } from '../traverse'

describe('plugin: PluginFn', () => {
    const source = `
$stack:    Helvetica, sans-serif;
$primary: #333;

body .test{
  font: 100% $stack;
  color: $primary;
}

`.trim()
    let result =
        `body .test{
  color:#333;
}
`
    beforeEach(() => {
        traverse.resetPlugin();
    });

    function traversePluginFn(context: TraverseContext) {
        let { currentNode } = context;
        if ((currentNode as CodegenNode).type === NodeTypes.DECLARATION && (currentNode as CodegenNode).left.value === 'font') {
            context.removeNode()
        }
    }

    function traverseVisitorPlugin(): PluginVisitor {
        return {
            visitor: {
                [NodeTypes.DECLARATION](context: TraverseContext) {
                    let { currentNode } = context;
                    if ((currentNode as CodegenNode).left.value === 'font') {
                        context.removeNode()
                    }
                }
            }
        }
    }

    function traverseVisitorPluginWithObject(): PluginVisitor {
        return {
            visitor: {
                [NodeTypes.DECLARATION]: {
                    enter(context: TraverseContext) {
                        let { currentNode } = context;
                        if ((currentNode as CodegenNode).left.value === 'font') {
                            context.removeNode()
                        }
                    }
                }
            }
        }
    }

    test('traverseVisitorPlugin', () => {
        let parsedAst = parse(source, {
            filename: `default.scss`,
            source
        })
        transform(parsedAst, {
            filename: `default.scss`,
            source
        })
        traverse.registerPlugin(traverseVisitorPlugin())

        let { code } = generate(parsedAst)
        expect(code).toEqual(result)
        expect(code).toMatchSnapshot()
    })

    test('traverseVisitorPluginWithObject', () => {
        let parsedAst = parse(source, {
            filename: `default.scss`,
            source
        })
        transform(parsedAst, {
            filename: `default.scss`,
            source
        })
        traverse.registerPlugin(traverseVisitorPluginWithObject())

        let { code } = generate(parsedAst)
        expect(code).toEqual(result)
        expect(code).toMatchSnapshot()
    })

    test('traversePluginFn', () => {

        let parsedAst = parse(source, {
            filename: `default.scss`,
            source
        })
        transform(parsedAst, {
            filename: `default.scss`,
            source
        })
        traverse.registerPlugin(traversePluginFn)

        let { code } = generate(parsedAst)
        expect(code).toEqual(result)
        expect(code).toMatchSnapshot()

        // walk(parsedAst,testPlugin)

    })
})
