import compile from '../index'
import { SourceMapConsumer, RawSourceMap } from 'source-map'

describe('compiler: integration tests', () => {
    const source = `
$stack:    Helvetica, sans-serif;
$primary: #333;

body .test{
  font: 100% $stack;
  color: $primary;
}

.message-shared {
    border: 1px solid #ccc;
    padding: 10px;
    color: $primary;
}

%message-shared {
  border: 1px solid #ccc;
  padding: 10px;
  color: $primary;
}

.message {
    @extend .message-shared;
}

.success {
    @extend .message-shared;
    border-color: green;
}

.error{
    color:red;
    @extend %message-shared
}
`.trim()
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
    test('Source Map', () => {
        const { code, map } = compile(source, {
            sourceMap: true,
            filename: `foo.scss`
        })

        expect(code).toMatchSnapshot()

        expect(map!.sources).toEqual([`foo.scss`])
        expect(map!.sourcesContent).toEqual([source])

        const consumer = new SourceMapConsumer(map as RawSourceMap)

        // selector
        expect(
            consumer.originalPositionFor(getPositionInCode(code, `body .test`))
        ).toMatchObject(getPositionInCode(source, `body .test`))

        // property
        expect(
            consumer.originalPositionFor(getPositionInCode(code, `font`))
        ).toMatchObject(getPositionInCode(source, `font`))

        expect(
            consumer.originalPositionFor(getPositionInCode(code, `color`))
        ).toMatchObject(getPositionInCode(source, `color`))

        /**
         * variable (one property line may contain multiple varialble which is multiple to one line situation)
         * in reality scss filename and line map could resolve most problem, so column info could be discarded in sourceMap
         */

        // expect(
        //     consumer.originalPositionFor(getPositionInCode(code, `#333`))
        // ).toMatchObject(getPositionInCode(source, `$primary`))

        // @extend
        expect(
            consumer.originalPositionFor(getPositionInCode(code, `.message,.success,.message-shared`))
        ).toMatchObject(getPositionInCode(source, `.message-shared`))

        expect(
            consumer.originalPositionFor(getPositionInCode(code, `border-color`))
        ).toMatchObject(getPositionInCode(source, `border-color`))

        // Todos  @import @mixin @if ...
    })
})