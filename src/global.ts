// Global compile-time function  and also ts-node runtime function
function isBrowser() {
    // @ts-ignore
    return '__BROWSER__' === '1';
}
export {
    isBrowser
}