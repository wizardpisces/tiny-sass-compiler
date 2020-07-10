# Project Target (Tutorial only)

This project is for people who want to understand parser and AST(abstract syntax tree) , and how they combine to make a compiler

[Tiny Sass AST Descriptor Syntax](https://github.com/wizardpisces/tiny-sass-compiler/blob/master/parser/readme.md)

## Sass Compiler

A tutorial Sass compiler in typescript for people familiar with javascript and want to know something about compiler

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
  "type": "PROGRAM",
  "children": [
    {
      "loc": {
        "start": {
          "offset": 11,
          "line": 1,
          "column": 11
        },
        "end": {
          "offset": 37,
          "line": 1,
          "column": 37
        }
      },
      "type": "ASSIGN",
      "left": {
        "loc": {
          "start": {
            "offset": 0,
            "line": 1,
            "column": 0
          },
          "end": {
            "offset": 11,
            "line": 1,
            "column": 11
          }
        },
        "type": "VARIABLE",
        "value": "$font-stack"
      },
      "right": {
        "type": "LIST",
        "value": [
          {
            "loc": {
              "start": {
                "offset": 16,
                "line": 1,
                "column": 16
              },
              "end": {
                "offset": 25,
                "line": 1,
                "column": 25
              }
            },
            "type": "TEXT",
            "value": "Helvetica"
          },
          {
            "loc": {
              "start": {
                "offset": 25,
                "line": 1,
                "column": 25
              },
              "end": {
                "offset": 26,
                "line": 1,
                "column": 26
              }
            },
            "type": "PUNC",
            "value": ","
          },
          {
            "loc": {
              "start": {
                "offset": 27,
                "line": 1,
                "column": 27
              },
              "end": {
                "offset": 37,
                "line": 1,
                "column": 37
              }
            },
            "type": "TEXT",
            "value": "sans-serif"
          }
        ]
      }
    },
    {
      "loc": {
        "start": {
          "offset": 53,
          "line": 2,
          "column": 14
        },
        "end": {
          "offset": 59,
          "line": 2,
          "column": 20
        }
      },
      "type": "ASSIGN",
      "left": {
        "loc": {
          "start": {
            "offset": 39,
            "line": 2,
            "column": 0
          },
          "end": {
            "offset": 53,
            "line": 2,
            "column": 14
          }
        },
        "type": "VARIABLE",
        "value": "$primary-color"
      },
      "right": {
        "type": "LIST",
        "value": [
          {
            "loc": {
              "start": {
                "offset": 55,
                "line": 2,
                "column": 16
              },
              "end": {
                "offset": 59,
                "line": 2,
                "column": 20
              }
            },
            "type": "TEXT",
            "value": "#333"
          }
        ]
      }
    },
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
              "offset": 80,
              "line": 5,
              "column": 6
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
            "type": "LIST",
            "value": [
              {
                "loc": {
                  "start": {
                    "offset": 82,
                    "line": 5,
                    "column": 8
                  },
                  "end": {
                    "offset": 86,
                    "line": 5,
                    "column": 12
                  }
                },
                "type": "TEXT",
                "value": "100%"
              },
              {
                "loc": {
                  "start": {
                    "offset": 87,
                    "line": 5,
                    "column": 13
                  },
                  "end": {
                    "offset": 98,
                    "line": 5,
                    "column": 24
                  }
                },
                "type": "VARIABLE",
                "value": "$font-stack"
              }
            ]
          }
        },
        {
          "loc": {
            "start": {
              "offset": 107,
              "line": 6,
              "column": 7
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
            "type": "LIST",
            "value": [
              {
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
                "type": "VARIABLE",
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
