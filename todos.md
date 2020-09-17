
## Todos: 

### feat

* parse errors
    1. don't have a semicolon should not report error
    2. correctly report syntax error when there is no mid colon
* contribute rollup/webpack/vite etc tiny-sass-compiler loader or plugin
* compare with sass online to better lint error
* middleware add hooks to capture mid product;
* handle recursive @import
* souce-map size compression (reference https://sokra.github.io/source-map-visualization generated map)
* add keyword @function
* replace @import with @use
* add '( | )' check to binary precedence
* add position to more tokens (doing)

### refactor

* make transform plug-in ( doing )
* update scripts/release.sh (reference vue-next)

### other

* use go to write the program -> then compile to Native -> auto load platform specific binary (reference [esbuild](https://github.com/evanw/esbuild) and [es-module-lexer](https://github.com/guybedford/es-module-lexer))
* complete test cases (doing)
* make API more flexible (reference  [esprima](https://www.npmjs.com/package/esprima) / [ast-types](https://www.npmjs.com/package/ast-types) / [escodegen](https://www.npmjs.com/package/escodegen))
