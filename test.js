const run = require('./index')

/**
 * Todos:
 * add test cases besides input output snapshots
 */

run('./test', './test-dist',{generateAstFile:true});