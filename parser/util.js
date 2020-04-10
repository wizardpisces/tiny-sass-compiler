const debug = (function () {
    let isDebug = false,
        count = 0;
    return () => {
        if (count++ > 20 && isDebug) {
            return true;
        }
        return false;
    }
})()

function is_else_if_statement(kw) {
    return /^@else\s*if/i.test(kw)
}

module.exports = {
    is_else_if_statement,
    debug
}