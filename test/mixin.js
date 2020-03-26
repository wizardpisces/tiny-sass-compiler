// Basic
// module.exports = `
// $property2 : skew(30deg, 20deg);
// @mixin transform($property,$property2) {
//   -webkit-transform: $property;
//   -ms-transform: $property;
//   transform: $property $property2;
// }
// .box { 
//   @include transform(rotate(30deg),$property2); 
//   left:1px;
// }`

// Basic not call form
// module.exports = `@mixin reset-list {
//   margin: 0;
//   padding: 0;
//   list-style: none;
// }

// @mixin horizontal-list {
//   @include reset-list;

//   li {
//     display: inline-block;
//   }
// }

// nav ul {
//   @include horizontal-list;
// }`

// Optional Arguments
module.exports = `
$font:    Helvetica, sans-serif;
@mixin replace-text($image,$x:default1, $y:default2) {
  text-indent: -99999em;
  overflow: hidden;
  text-align: left;

  background {
    image: $image;
    repeat: no-repeat;
    position: $x $y;
  }
}

.mail-icon {
  @include replace-text(url("/images/mail.svg"),$font);
}`