## Description 

Another SASS compiler written from scratch, runnable both in ***node*** and ***browser*** environment

[Demo](https://wizardpisces.github.io/sass)

## Target
This project(**Not Production Ready**) is for people who want to understand how to write a compiler; Basic Steps:

1. SourceCode (SASS Scanning)  
2. TokenStream (Parsing) 
3. [AST or Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (Analysis) 
4. [IR or Intermediate_representation](https://en.wikipedia.org/wiki/Intermediate_representation)
5. HighLevelLanguage (CSS Code and SourceMap Generation)

## Features:

1. Variables
2. Nesting
3. Extend/Inheritance
4. Operators
5. Mixins
6. Modules ([@import](https://sass-lang.com/documentation/at-rules/import) and [@use](https://sass-lang.com/documentation/at-rules/use)(which is more efficient than @import))

## Installation

```bash
npm install --save tiny-sass-compiler
```

### Usage in node

```ts
import sass from "tiny-sass-compiler";

//render API
sass.render({filename:'./default.scss'},(err,result)=>{
  console.log(result.code)
})
// or renderSync
const result = sass.renderSync({filename:'./default.scss'})
console.log(result.code)
```

### Usage in browser

```ts
import {compile} from  'tiny-sass-compiler/dist/tiny-sass-compiler.esm-browser.prod.js'
const result = compile(`
$font-stack:    Helvetica, sans-serif;
$primary-color: #333;

body .test{
  font: 100% $font-stack;
  color: $primary-color;
}`)

console.log(result.code)
```

## Terminal Setup

```bash
npm install -g tiny-sass-compiler
```

### Command Line Interface

*Support **.scss** extension for now*

### Usage


`tiny-sass <input> [output]`

The `input` and `output` must be a directory

Example

```bash
tiny-sass src/ dist/
```

*will generate intermediate AST file in dist/ast and css file in dist/css*

## Test

### Snapshot Test
**Development**
```bash
npm run test-source
```
**Production**
```bash
npm run test
```
*will generate intermediate AST file in test-dist/ast and css file in test-dist/css*

### Example:

#### input:

```scss
$font-stack:    Helvetica, sans-serif;
$primary-color: #333;

body .test{
  font: 100% $font-stack;
  color: $primary-color;
}
```
#### output:

CSS
```css
body .test {
    font: 100% Helvetica, sans-serif;
    color: #333;
}
```

### Jest test

```bash
npm run jest
```

*Interested in more intermediate status? View files in ./test-dist/ which contains ast after parse+transform and dist code after codegen*

## Other Readme

* [AST Descriptor Syntax](https://github.com/wizardpisces/tiny-sass-compiler/blob/master/src/parse/ast.ts)
* [AST travesal Plugin](https://github.com/wizardpisces/tiny-sass-compiler/blob/master/traversal.md)
* [AST Interpret Transform Plugin](https://github.com/wizardpisces/tiny-sass-compiler/blob/master/transform.md)

## Reference

* [csstree](https://github.com/csstree/csstree)
* [astexplorer](https://astexplorer.net/#/gist/244e2fb4da940df52bf0f4b94277db44/e79aff44611020b22cfd9708f3a99ce09b7d67a8)
* [vue-next/compiler-core](https://github.com/vuejs/vue-next/tree/master/packages/compiler-core)
* [lisperator](http://lisperator.net/pltut/)
* [less](https://less.bootcss.com/features/#plugin-at-rules)
* [hast](https://github.com/syntax-tree/hast)
* [unist](https://github.com/syntax-tree/unist)
