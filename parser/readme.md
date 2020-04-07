# Parser readme

# AST tree node

## Expression

```js

op { type: "op", value: "!=" }            // + - % * / != ==
boolean { type: "boolean", value: true | false } //treat as bool in IfStatement -> test
str { type: "str", value: string }  // str = (str\s+ | var\s+)*
var { type: "var", value: string } // var.value === variable's name string
var_key { type: "var_key", value: string } // to solve assign { #{var} : value }
list { type:"list",value:[ str | var ] }
binary { type: "binary", operator: OPERATOR, left: str | var | binary, right: str | var | binary } // + | - | * | /
```

## Statement:

```js
body { type:"body", chidren:[ Statement ] }
@include { type: "@include", id:{ type:"identifier", name: string } , args: [ str | var | binary ] }
@extend { type:"@extend", param: str | placeholder }
@import { type: "@import", params:[ str ] }
@mixin  { type: "@mixin", id:{ type:"identifier", name: string } , params: [ var | assign ], body: body }
child { type:"child", selector: str | placeholder, children: [ Expression ] }
assign { type: "assign", operator: ":", left: str | var | var_key, right: list }
```

### Choice

```js
@if { type:"IfStatement", test: Expression, consequent: body, alternate: IfStatement | body | null }

```

## Program

```js
prog { type:"prog", selector: str, prog: [ Statement ] }
```
Todos: 

* add '( | )' check to binary precedence
* optimize AST Node types
* optimize parser files organization