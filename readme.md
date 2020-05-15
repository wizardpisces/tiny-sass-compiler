# Sass Compiler

Sass compiler in javascript

## Description 

A compiler that compile sass to css

### Features:

1. Variables
2. Nesting
3. Extend/Inheritance
4. Operators
5. Mixins
6. Modules

### Project Target

This project is for people who want to understand parser and AST(abstract syntac tree) , and how they combine to make a compiler

[Sass AST Discriptor Syntax](https://github.com/wizardpisces/tiny-sass-compiler/blob/master/parser/readme.md)

### Example

```js
npm run test
```

Sample1:

input:

```scss
$top : 20px;
$margin: 2px;
$right: $top;
.main2{
    margin: 1px;
    right: $right;
}
.main {
    top  : $top;   
    .child1{
        margin:$margin;
        .child2{
            background:green;
        }
    }
}
```
output:

```css
 .main2{margin:1px;right:20px;} 
 .main{top:20px;} 
 .main .child1{margin:2px;} 
 .main .child1 .child2{background:green;}
```