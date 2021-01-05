 # AST traversal

 Handler on node entrance, i.e. before any nested node is processed.

***ast traversal api applies only on dist code(css) related ast***

In fact tiny-sass-compiler's source code generation depends on the same traverse as plugin

Detail usage can refer to
```
/src/__tests__/plugin.spec.ts
```
or
source code generator: 
```
/src/genCodeVisitor.ts
```

### Todos
refer to 
* [babel-types](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#babel-types)
* [babel-template](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#babel-template)

## reference 
* https://github.com/csstree/csstree/blob/master/docs/traversal.md 
* https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-visitors