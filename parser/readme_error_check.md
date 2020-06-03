
## use superstruct to construct ast schema then use schema to check generated ast

construct struct

```ts
Types : {
    basic: number | string | boolean | ...
    custom: {
        a : validatorA,
        b : validatorB
    },
    complicated: dynamic | lazy | enum | ...
}

// Props kept in closure during shema construction
interface Struct {
    check(value: any,...)
    Props: Record<string,Struct>
}

struct:Struct = superstruct(custom)

// Use struct schema to check data while constructing path by schema but not ast
// scan schema then check corresponding data
struct(data) -> struct.check(data) 
                -> Props[key1].check()
                -> Props[key2].check()
                .
                .
                .

```