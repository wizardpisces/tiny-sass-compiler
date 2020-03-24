const parser = require('./parser')
const compiler = require('./compiler')
const fs = require('fs');

const test_cases = {
    // var_nest: require('./test/var-nested.js'),
    // var_simple: require('./test/var-simple.js'),
    // extend: require('./test/extend.js'),
    // operator: require('./test/operator.js'),
    mixin: require('./test/mixin.js'),
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
        fs.writeFile(`./test-result/result-${case_name}.scss`, (compiler(result)), function (err) {
            if (err) {
                console.log(`compile failed ${case_name}`)
                return console.error(err);
            }
            console.log(`compile success ${case_name}`)
        })
    })
}
