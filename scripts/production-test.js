const run = require('../dist/tiny-sass-compiler.cjs.prod.js')
/**
 * Todos:
 * add test cases besides input output snapshots
 */
run.default('./test', './test-dist', {
    genOtherInfo: true,
    sourceMap: true
});