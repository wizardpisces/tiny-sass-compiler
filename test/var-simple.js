/**
 * test properties contain both string and variable eg: font: 100% $font-stack;
*/

module.exports = scss = `
$font-stack:    Helvetica, sans-serif;
$primary-color: #333;

body .test{
  font: 100% $font-stack;
  color: $primary-color;
}
`
