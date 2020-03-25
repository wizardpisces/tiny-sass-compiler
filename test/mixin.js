

module.exports = `
$property2 : skew(30deg, 20deg);
@mixin transform($property,$property2) {
  -webkit-transform: $property;
  -ms-transform: $property;
  transform: $property $property2;
}
.box { 
  @include transform(rotate(30deg),$property2); 
  left:1px;
}`