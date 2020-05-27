# Sass Compiler

Sass compiler in javascript

## Description 

A compiler that compile sass to css ( tutorial only, not for production )

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

## Setup

```bash
npm install -g tiny-sass-compiler
```

## Command Line Interface

*Support .scss extension for now*

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

### Sample1:

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

AST
```json
{
  "type": "prog",
  "prog": [
    {
      "start": 0,
      "end": 37,
      "type": "assign",
      "left": {
        "start": 0,
        "end": 11,
        "type": "var",
        "value": "$font-stack"
      },
      "right": {
        "type": "list",
        "value": [
          {
            "start": 16,
            "end": 25,
            "type": "str",
            "value": "Helvetica"
          },
          {
            "start": 25,
            "end": 26,
            "type": "punc",
            "value": ","
          },
          {
            "start": 27,
            "end": 37,
            "type": "str",
            "value": "sans-serif"
          }
        ]
      }
    },
    {
      "start": 39,
      "end": 59,
      "type": "assign",
      "left": {
        "start": 39,
        "end": 53,
        "type": "var",
        "value": "$primary-color"
      },
      "right": {
        "type": "list",
        "value": [
          {
            "start": 55,
            "end": 59,
            "type": "str",
            "value": "#333"
          }
        ]
      }
    },
    {
      "type": "child",
      "selector": {
        "start": 62,
        "end": 72,
        "type": "str",
        "value": "body .test"
      },
      "children": [
        {
          "start": 76,
          "end": 98,
          "type": "assign",
          "left": {
            "start": 76,
            "end": 80,
            "type": "str",
            "value": "font"
          },
          "right": {
            "type": "list",
            "value": [
              {
                "start": 82,
                "end": 86,
                "type": "str",
                "value": "100%"
              },
              {
                "start": 87,
                "end": 98,
                "type": "var",
                "value": "$font-stack"
              }
            ]
          }
        },
        {
          "start": 102,
          "end": 123,
          "type": "assign",
          "left": {
            "start": 102,
            "end": 107,
            "type": "str",
            "value": "color"
          },
          "right": {
            "type": "list",
            "value": [
              {
                "start": 109,
                "end": 123,
                "type": "var",
                "value": "$primary-color"
              }
            ]
          }
        }
      ]
    }
  ]
}
```