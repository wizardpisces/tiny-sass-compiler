import run from '../index'

/**
 * Todos:
 * add test cases besides input output snapshots
 */
run('./test', './test-dist',{
    genOtherInfo: true,
    sourceMap:true
});