
## Todos: 

### feat

* upgrade transformModule reference to node require principle (same path cache), 
* write selector lexical analyze in detail
* support length(n) namespace for @use ? Is it necessary?
* implement sass @use and handle recursive @import [reference here](https://sass-lang.com/documentation/at-rules/import)
* add traverse plugin to merge same selector, and cover more than children traverse (should also includes RULE Selector node)
* add static check for acss in vscode
* add browser style[type='text/acss'] and link[rel='RootNode/acss'] support
* add changeLog generation （reference vite）
* resolve css internal keyword @media etc (keep them as raw code)
* parse errors
    1. correctly report syntax error when there is no bracket
* contribute rollup/webpack/vite etc tiny-sass-compiler loader or plugin
* add '( | )' check to binary precedence, only support whitespace gap operator (eg: 1 + 2 but not 1+2)
* add position to more tokens (doing)
* update scripts/release.sh (reference vue-next)

### other advance

* simple webkit(based on canvas) + simple js(based on estree)
* use go to write the program -> then compile to Native -> auto load platform specific binary (reference [esbuild](https://github.com/evanw/esbuild) and [es-module-lexer](https://github.com/guybedford/es-module-lexer))
* complete test cases (doing)
* make API more flexible (reference  [esprima](https://www.npmjs.com/package/esprima) / [ast-types](https://www.npmjs.com/package/ast-types) / [escodegen](https://www.npmjs.com/package/escodegen))
