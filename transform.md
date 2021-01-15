## Usage

Using a @plugin at-rule is similar to using an @import for your .scss files.
```less
@plugin "my-plugin";  // automatically appends .js if no extension
```

```ts
module.exports = {
    install: function(functions:Enviroment) {
        functions.add('pi', function() {
            return Math.PI;
        });
    }
};
```

[Enviroment Definition](https://github.com/wizardpisces/tiny-sass-compiler/blob/master/src/enviroment/Enviroment.ts)

## Reference
* https://less.bootcss.com/features/#plugin-at-rules