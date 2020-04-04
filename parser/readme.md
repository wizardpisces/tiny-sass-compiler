# AST tree node

## Expression

```js
str { type: "str", value: string }  // str = (str\s+ | var\s+)*
var { type: "var", value: string } // var.value === variable's name string
var_key { type: "var_key", value: string } // to solve assign { #{var} : value }
list { type:"list",value:[ str | var ] }
body { type:"body", chidren:[ Statement ] }
binary { type: "binary", operator: OPERATOR, left: str | var | binary, right: str | var | binary } // + | - | * | /
```

## Statement:

```js
@include { type: "@include", id:{ type:"identifier", name: string } , args: [ str | var | binary ] }
@extend { type:"@extend", param: str | placeholder }
@import { type: "@import", params:[ str ] }
@mixin  { type: "@mixin", id:{ type:"identifier", name: string } , params: [ var | assign ], body: body }
child { type:"child", selector: str | placeholder, children: [ Expression ] }
assign { type: "assign", operator: ":", left: str | var | var_key, right: list }
```

## Program

```js
prog { type:"prog", selector: str, prog: [ Statement ] }
```
Todos: 
* optimize AST Node types