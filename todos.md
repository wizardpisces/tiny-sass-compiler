
## Todos: 

### feat

* add @forward
* try to add more detailed selector parsing reference [css-selector-parser](https://github.com/mdevils/css-selector-parser)
* use [fiber](https://www.npmjs.com/package/fibers)/[sass-fiber](https://sass-lang.com/documentation/js-api#fiber) to optimize render/renderSync ?
* [incremental parsing](https://tree-sitter.github.io/tree-sitter/)?
* add '( | )' check to binary precedence, only support whitespace gap operator (eg: 1 + 2 but not 1+2)
* write selector lexical analyze in detail (complete selector parse)
* support length(n) namespace for @use ? Is it necessary?
* add static check for acss in vscode
* add browser style[type='text/acss'] and link[rel='RootNode/acss'] support
* add changeLog generation （reference vite）
* parse errors
    1. correctly report syntax error when there is no bracket
* contribute rollup/webpack/vite etc tiny-sass-compiler loader or plugin
* update scripts/release.sh (reference vue-next)

### other advance

* simple webkit(based on canvas) + simple js(based on estree)
* use go to write the program -> then compile to Native -> auto load platform specific binary (reference [esbuild](https://github.com/evanw/esbuild) and [es-module-lexer](https://github.com/guybedford/es-module-lexer))
* complete test cases (doing)
* make API more flexible (reference  [esprima](https://www.npmjs.com/package/esprima) / [ast-types](https://www.npmjs.com/package/ast-types) / [escodegen](https://www.npmjs.com/package/escodegen))
