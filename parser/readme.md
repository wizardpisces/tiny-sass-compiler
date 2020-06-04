# SASS AST Descriptor Syntax
  
This document specifies the core sass AST node types that support the sass grammar.

## literal

null

## Expression

```js

punc { type: "punc", value: "(" }           // punctuation: parens((|)), comma(,), semicolon(;) etc.
op { type: "op", value: "!=" }            // + - % * / != ==
boolean { type: "boolean", value: true | false } //treat as bool in IfStatement -> test
str { type: "str", value: string }  // str = (str\s+ | var\s+)*
var { type: "var", value: string } // var.value === variable's name , expression deleted after evaluation
var_key { type: "var_key", value: string } // to solve "str-#{var}" , expression replaced after evaluation
placeholder {type: "placeholder", value: '%str'}
/**
 * https://sass-lang.com/documentation/values/lists
 * any expressions separated with spaces or commas count as a list;
 * iterable eg: $each value in list
  */

list { type:"list",value:[ str | var | var_key | punc | binary ] }
binary { type: "binary", operator: OPERATOR, left: str | var | binary, right: str | var | binary } // + | - | * | / | %

```

## Statement:

### Normal

```js
body { type:"body", chidren:[ Statement ] } // difference between body and child: child contains selector
@import { type: "@import", params:[ str ] }
assign { type: "assign", left: str | var | var_key, right: list } // border : 1px solid red
child { type:"child", selector: str | placeholder | list, children: [ Statement ] }
@include { type: "@include", id:{ type:"identifier", name: string } , args: [ str | var | binary | assign ] }
@extend { type:"@extend", param: str | placeholder }
@mixin  { type: "@mixin", id:{ type:"identifier", name: string } , params: [ var | assign ], body: body }
@error  { type: "@error", value: list }
```

### Choice

```js
@if { type:"IfStatement", test: Expression, consequent: body, alternate: IfStatement | body | null }

```

### Loops

```js
@each { type:"EachStatement", left: Expression, right: Expression, body:child }
```
## Program

```js
prog { type:"prog", prog: [ Statement ] }
```
Todos: 

* Error handling to specific position (source filepath , line ,col ,token)
* add keyword @function
* add position to more tokens
* add '( | )' check to binary precedence
* optimize AST Node types
* optimize parser files organization
* reorganize readme.md
* Error recovery
