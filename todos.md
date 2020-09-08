
## Todos: 

### feat

* 中间文件通过增加阶段hook来捕获出来，而不是暴露出方法重复的build来写
* release for browser to use in online demo in wizardpisces.github.io
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
