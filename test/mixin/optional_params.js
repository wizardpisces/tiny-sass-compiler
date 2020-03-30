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
