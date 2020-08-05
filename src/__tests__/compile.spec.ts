import compile from '../index'
import { SourceMapConsumer, RawSourceMap } from 'source-map'

describe('compiler: integration tests', () => {
    const source = `
$font-stack:    Helvetica, sans-serif;
$primary-color: #333;

body .test{
  font: 100% $font-stack;
  color: 
  $primary-color;
}`.trim()
    interface Pos {
        line: number
        column: number
        name?: string
    }

    function getPositionInCode(
        code: string,
        token: string,
        expectName: string | boolean = false
    ): Pos {
        const generatedOffset = code.indexOf(token)
        let line = 1
        let lastNewLinePos = -1
        for (let i = 0; i < generatedOffset; i++) {
            if (code.charCodeAt(i) === 10 /* newline char code */) {
                line++
                lastNewLinePos = i
            }
        }
        const res: Pos = {
            line,
            column:
                lastNewLinePos === -1
                    ? generatedOffset
                    : generatedOffset - lastNewLinePos - 1
        }
        if (expectName) {
            res.name = typeof expectName === 'string' ? expectName : token
        }
        return res
    }
    test('function mode', () => {
        const { code, map } = compile(source, {
            sourceMap: true,
            filename: `foo.scss`
        })

        expect(code).toMatchSnapshot()

        expect(map!.sources).toEqual([`foo.scss`])
        expect(map!.sourcesContent).toEqual([source])

        const consumer = new SourceMapConsumer(map as RawSourceMap)
        
        console.log(getPositionInCode(code, `test`))
        console.log(consumer.originalPositionFor(getPositionInCode(code, `test`)))
        console.log(getPositionInCode(source, `test`))
        expect(
            consumer.originalPositionFor(getPositionInCode(code, `test`))
        ).toMatchObject(getPositionInCode(source, `test`))
    })
})