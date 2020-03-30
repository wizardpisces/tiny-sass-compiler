
// variable key ,basic parent selector &
module.exports = `
@mixin rtl($property, $ltr-value, $rtl-value) {
  #{$property}: $ltr-value;

   [dir=rtl] &.second {
    #{ $property }: $rtl-value;
  }
}

.sidebar {
  @include rtl(float, left, right);
}`