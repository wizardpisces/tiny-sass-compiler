 # AST traversal

 Handler on node entrance, i.e. before any nested node is processed.

***ast traversal api applies after node transform and interpret and before codegening***

 ### enter
 * node – the AST node a walker entering to
 * list – is a reference for the list; it's useful for list operations like remove() or insert()

Detail travesal API reference /src/__tests__/plugin.spec.ts

### Todos

* complete traverse with visitor mode and optimize codegen tree using the same traverser
* merge plugin?

## reference 
* https://github.com/csstree/csstree/blob/master/docs/traversal.md 
* https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-visitors