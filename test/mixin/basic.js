// Basic not call form
module.exports = `@mixin reset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

@mixin horizontal-list {
  @include reset-list;

  li {
    display: inline-block;
  }
}

nav ul {
  @include horizontal-list;
}`