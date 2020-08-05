import compile from '../index'
import { SourceMapConsumer, RawSourceMap } from 'source-map'

describe('compiler: integration tests', () => {
    const source = `
$stack:    Helvetica, sans-serif;
$primary: #333;

body .test{
  font: 100% $stack;
  color: $primary;
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
        
        console.log('generated position',getPositionInCode(code, `body .test`))
        console.log('recovered from generated:',consumer.originalPositionFor(getPositionInCode(code, `body .test`)))
        console.log('source position:',getPositionInCode(source, `body .test`))
        expect(
            consumer.originalPositionFor(getPositionInCode(code, `body .test`))
        ).toMatchObject(getPositionInCode(source, `body .test`))

        expect(
            consumer.originalPositionFor(getPositionInCode(code, `font`))
        ).toMatchObject(getPositionInCode(source, `font`))

        expect(
            consumer.originalPositionFor(getPositionInCode(code, `color`))
        ).toMatchObject(getPositionInCode(source, `color`))
    })
})