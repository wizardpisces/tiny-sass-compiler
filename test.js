const parser = require('./parser')
const compiler = require('./compiler')
const fs = require('fs');

/**
 * Todos:
 * enhance test
 */

const test_cases = {
    var_nest: require('./test/var-nested.js'),
    var_simple: require('./test/var-simple.js'),
    extend: require('./test/extend.js'),
    operator: require('./test/operator.js'),
    mixin_optional_params: require('./test/mixin/optional_params.js'),
    mixin_basic: require('./test/mixin/basic.js'),
    mixin_var_key: require('./test/mixin/var_key.js'),
    mixin_params: require('./test/mixin/params.js'),
}

for(case_name in test_cases){
    run_case(case_name,test_cases[case_name])
}

function run_case(case_name,scss){
    let result = parser(scss)
    fs.writeFile(`./test-result/ast-${case_name}.json`, JSON.stringify(result), function (err) {
        if (err) {
            console.log(`parse failed ${case_name}`)            
            return console.error(err);
        }
        // console.log(`parse success ${case_name}`)
        fs.writeFile(`./test-result/result-${case_name}.css`, (compiler(result)), function (err) {
            if (err) {
                console.log(`compile failed ${case_name}`)
                return console.error(err);
            }
            console.log(`compile success ${case_name}`)
        })
    })
}
