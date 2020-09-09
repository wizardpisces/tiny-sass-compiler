'use strict'

const isNode =
    typeof process !== 'undefined' &&
    Object.prototype.toString.call(process) === '[object process]';

if (isNode) {
    export * from './dist/tiny-sass-compiler.esm-bundler.prod.js'
} else {
    export * from './dist/tiny-sass-compiler.esm-browser.prod.js'
}
