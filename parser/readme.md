# SASS AST Descriptor Syntax
  
This document specifies the core sass AST node types that support the sass grammar.

## literal

null

## Expression

```js

PUNC { type: PUNC, value: "(" }           // punctuation: parens((|)), comma(,), semicolon(;) etc.
OPERATOR { type: OPERATOR, value: "!=" }            // + - % * / != ==
TEXT { type: TEXT, value: string }  // TEXT = (TEXT\s+ | TEXT\s+)*
VARIABLE { type: VARIABLE, value: string } // VARIABLE.value === variable's name , expression deleted after evaluation
VAR_KEY { type: NodeTypes.VAR_KEY, value: string } // to solve "TEXT-#{VARIABLE}" , expression replaced after evaluation
PLACEHOLDER {type: NodeTypes.PLACEHOLDER, value: '%TEXT'}
/**
 * https://sass-lang.com/documentation/values/lists
 * any expressions separated with spaces or commas count as a list;
 * iterable eg: $each value in list
  */

LIST { type:NodeTypes.LIST,value:[ TEXT | VARIABLE | VAR_KEY | PUNC | binary ] }
binary { type: NodeTypes.BINARY, operator: op, left: TEXT | VARIABLE | binary, right: TEXT | VARIABLE | binary } // + | - | * | / | %

```

## Statement:

### Normal

```js
body { type:NodeTypes.BODY, chidren:[ Statement ] } // difference between body and child: child contains selector
@import { type: NodeTypes.IMPORT, params:[ TEXT ] }
assign { type: "assign", left: TEXT | VARIABLE | var_key, right: list } // border : 1px solid red
child { type:"child", selector: TEXT | placeholder | list, children: [ Statement ] }
@include { type: "@include", id:{ type:"identifier", name: string } , args: [ TEXT | VARIABLE | binary | assign ] }
@extend { type:"@extend", param: TEXT | placeholder }
@mixin  { type: "@mixin", id:{ type:"identifier", name: string } , params: [ VARIABLE | assign ], body: body }
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

* transform to ts for better documents
* tranform (start,end) to location(line,column,offset)，Error handling to specific position (source filepath , line ,col ,token)
* add keyword @function
* add position to more tokens
* add '( | )' check to binary precedence
* optimize AST Node types
* optimize parser files organization
* reorganize readme.md
* Error recovery
