const parser = require('./parser.js')
const compiler = require('./compiler.js')
const fs = require('fs');

var scss = `
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
}`

// scss = `
// $font-stack:    Helvetica, sans-serif;
// $primary-color: #333;

// body {
//   font: 100% $font-stack;
//   color: $primary-color;
// }
// `

let result = parser(scss)

fs.writeFile('./ast-example.json', JSON.stringify(result), function (err) {
    if (err) {
        return console.error(err);
    }
    console.log('success')
})
fs.writeFile('./test-example.scss', (compiler(result)), function (err) {
    if (err) {
        return console.error(err);
    }
    console.log('success')
})