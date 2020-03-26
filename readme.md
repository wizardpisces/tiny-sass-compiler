# Simple sass compiler

This is a simplified example of all the major pieces of a compiler written in easy to read JavaScript.

## Description 
A simple compiler that transform basic sass to css

### Partially Support features:

1. Variables
2. Nesting
3. Extend/Inheritance
4. Operators
5. Mixins

## Target people

This project is for people who want to understand parser and AST(abstract syntac tree) , and how they combine to make a compiler

## Tests

Run with node test.js

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
