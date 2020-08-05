# Project Target

This project is for people who want to understand parser and AST(abstract syntax tree) , and how they combine to make a compiler

[Tiny Sass AST Descriptor Syntax](https://github.com/wizardpisces/tiny-sass-compiler/blob/master/src/parser/ast.ts)

## Sass Compiler

A tiny Sass compiler in javascript for people familiar with javascript and want to know more about compiler

## Description 

A compiler that compile sass to css ( tutorial only, not for production )

### Features:

1. Variables
2. Nesting
3. Extend/Inheritance
4. Operators
5. Mixins
6. Modules

## Setup

```bash
npm install -g tiny-sass-compiler
```

## Command Line Interface

*Support **.scss** extension for now*

### Usage


`tiny-sass <input> [output]`

The `input` and `output` must be a directory

Example

```bash
tiny-sass src/ dist/
```

*will generate intermediate AST file in dist/ast and css file in dist/css*

## Project Snapshot Test

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

Before code generation AST
```json
{
  "type": "PROGRAM",
  "children": [
    {
      "type": "CHILD",
      "selector": {
        "loc": {
          "start": {
            "offset": 62,
            "line": 4,
            "column": 0
          },
          "end": {
            "offset": 72,
            "line": 4,
            "column": 10
          }
        },
        "type": "TEXT",
        "value": "body .test"
      },
      "children": [
        {
          "loc": {
            "start": {
              "offset": 76,
              "line": 5,
              "column": 2
            },
            "end": {
              "offset": 98,
              "line": 5,
              "column": 24
            }
          },
          "type": "ASSIGN",
          "left": {
            "loc": {
              "start": {
                "offset": 76,
                "line": 5,
                "column": 2
              },
              "end": {
                "offset": 80,
                "line": 5,
                "column": 6
              }
            },
            "type": "TEXT",
            "value": "font"
          },
          "right": {
            "type": "TEXT",
            "loc": {
              "start": {
                "offset": 82,
                "line": 5,
                "column": 8
              },
              "end": {
                "offset": 98,
                "line": 5,
                "column": 24
              }
            },
            "value": "100% Helvetica, sans-serif"
          }
        },
        {
          "loc": {
            "start": {
              "offset": 102,
              "line": 6,
              "column": 2
            },
            "end": {
              "offset": 126,
              "line": 7,
              "column": 16
            }
          },
          "type": "ASSIGN",
          "left": {
            "loc": {
              "start": {
                "offset": 102,
                "line": 6,
                "column": 2
              },
              "end": {
                "offset": 107,
                "line": 6,
                "column": 7
              }
            },
            "type": "TEXT",
            "value": "color"
          },
          "right": {
            "type": "TEXT",
            "loc": {
              "start": {
                "offset": 112,
                "line": 7,
                "column": 2
              },
              "end": {
                "offset": 126,
                "line": 7,
                "column": 16
              }
            },
            "value": "#333"
          }
        }
      ]
    }
  ],
  "source": "$font-stack:    Helvetica, sans-serif;\n$primary-color: #333;\n\nbody .test{\n  font: 100% $font-stack;\n  color: \n  $primary-color;\n}\n"
}
```

*Interested in more intermediate status? Please view files in ./test-dist/*

## Todos: 

* code gen sourceMap, generate source for module(import)? ( doing )
* update scripts/release.sh (reference vue-next)
* ~~tranform (start,end) to location(line,column,offset)，Error handling to specific position (source filepath , line ,col ,token)~~
* make transform plug-in ( doing )
* add keyword @function
* add position to more tokens (doing)
* add '( | )' check to binary precedence
* Error recovery
* complete test cases
