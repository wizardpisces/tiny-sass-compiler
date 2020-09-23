'use strict'

const isNode =
    typeof process !== 'undefined' &&
    Object.prototype.toString.call(process) === '[object process]';

if (isNode) {
    module.exports = require('./dist/tiny-sass-compiler.cjs.prod.js')
} else {
    module.exports = require('./dist/tiny-sass-compiler.esm-browser.prod.js')
}
