
## Todos: 

### feat

* complete css selector parser
* add buildin modules and less.js like @plugin
* complete @keyframes (based on @content)
* add static check for acss in vscode
* add browser style[type='text/acss'] and link[rel='RootNode/acss'] support
* add changeLog generation （reference vite）
* binary expression has to be divided with whitespace for now, remove whitespace is needed
* resolve css internal keyword @media etc (keep them as raw code)
* how to evaluate CallExpression , and how to parse to CallExpression in old parse_consecutive_str
* parse errors
    1. correctly report syntax error when there is no bracket
* create static check 'typesass' just as ts to js
* contribute rollup/webpack/vite etc tiny-sass-compiler loader or plugin
* add '( | )' check to binary precedence, only support whitespace gap operator (eg: 1 + 2 but not 1+2)
* replace @import with @use, handle recursive @import
* add position to more tokens (doing)

### refactor

* transform fop to oop and import visitor mode
* make transform plug-in ( doing )
* update scripts/release.sh (reference vue-next)

### other

* simple webkit(based on canvas) + simple js(based on estree)
* use go to write the program -> then compile to Native -> auto load platform specific binary (reference [esbuild](https://github.com/evanw/esbuild) and [es-module-lexer](https://github.com/guybedford/es-module-lexer))
* complete test cases (doing)
* make API more flexible (reference  [esprima](https://www.npmjs.com/package/esprima) / [ast-types](https://www.npmjs.com/package/ast-types) / [escodegen](https://www.npmjs.com/package/escodegen))
