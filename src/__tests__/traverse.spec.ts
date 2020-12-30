import { parse, transform, generate } from '../index'
import { NodeTypes, CodegenNode } from '../parse/ast'
import { TraverseContext, registerPlugin, PluginVisitor, resetPlugin } from '../traverse'

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
        resetPlugin();
    });

    function testPlugin(context: TraverseContext) {
        let { currentNode } = context;
        if ((currentNode as CodegenNode).type === NodeTypes.DECLARATION && (currentNode as CodegenNode).left.value === 'font') {
            context.removeNode()
        }
    }

    function visitorPlugin(): PluginVisitor {
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

    test('registerPlugin with PluginVisitor', () => {
        let parsedAst = parse(source, {
            filename: `default.scss`,
            source
        })
        transform(parsedAst, {
            filename: `default.scss`,
            source
        })
        registerPlugin(visitorPlugin())

        let { code } = generate(parsedAst)
        expect(code).toEqual(result)
        expect(code).toMatchSnapshot()
    })

    test('registerPlugin with PluginFn', () => {
        
        let parsedAst = parse(source, {
            filename: `default.scss`,
            source
        })
        transform(parsedAst, {
            filename: `default.scss`,
            source
        })
        registerPlugin(testPlugin)

        let { code } = generate(parsedAst)
        expect(code).toEqual(result)
        expect(code).toMatchSnapshot()

        // walk(parsedAst,testPlugin)

    })
})
