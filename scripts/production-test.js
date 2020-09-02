const run = require('../dist/tiny-sass-compiler.cjs.prod')

/**
 * Todos:
 * add test cases besides input output snapshots
 */
run('./test', './test-dist', {
    genOtherInfo: true,
    sourceMap: true
});