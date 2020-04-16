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

const PRECEDENCE = {
    "=": 1,
    "||": 2,
    "&&": 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20,
};

module.exports = {
    debug,
    PRECEDENCE
}