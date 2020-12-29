import { parse, transform, generate } from '../index'
import { CodegenNode, NodeTypes } from '../parse/ast'
import { PluginContext, walk, registerPlugin } from '../traverse'
describe('plugin: tests', () => {
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
    function testPlugin(node: CodegenNode, context: PluginContext) {
        if (node.type === NodeTypes.DECLARATION && node.left.value === 'font') {
            context.remove(node)
        }
    }

    test('registerPlugin', () => {
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

        walk(parsedAst,testPlugin)
    })
})
