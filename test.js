const parser = require('./parser')
const compiler = require('./compiler')
const fs = require('fs');
const path = require('path');

/**
 * Todos:
 * enhance test
 */

function require_css(path){
    return fs.readFileSync(path,'utf8')
}

function run(inputDir,outputDir = './test-dist'){
    
    function run_test(filePath) {
        if (path.extname(filePath) !== '.scss') return;
        let source = require_css(filePath),
            basename = path.basename(filePath, '.scss'),
            dirname = path.dirname(filePath),
            astDistPath = path.join(outputDir, 'ast', dirname.substr(4)),
            cssDistPath = path.join(outputDir, 'css', dirname.substr(4)),
            ast = parser(source),
            compiled = compiler(ast);

        function write_ast() {
            fs.writeFile(path.join(astDistPath, basename + '.json'), JSON.stringify(ast), function (err) {
                if (err) {
                    console.error(err)
                    return console.error(`parse failed ${basename}`);
                }
            })
        }

        function write_compiled() {
            fs.writeFile(path.join(cssDistPath, basename + '.css'), compiled, function (err) {
                if (err) {
                    return console.error(`compile failed ${basename}`);
                }
                console.log(`compile success ${basename}`)
            })
        }

        if (!fs.existsSync(astDistPath)) {
            console.log(astDistPath)
            fs.mkdirSync(path.join(__dirname, astDistPath), { recursive: true })
        }
        if (!fs.existsSync(cssDistPath)) {
            fs.mkdirSync(cssDistPath, { recursive: true })
        }

        write_ast()
        write_compiled()
    }
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.readdirSync(inputDir).forEach((filename)=>{
        if(filename === 'module') return;//Todos 先屏蔽模块化的compile
        let filePath = path.join(inputDir, filename),
            stat = fs.lstatSync(filePath)
        if (stat.isFile()) {
            return run_test(filePath)
        }else if(stat.isDirectory()){
            run(filePath)
        }else{
            console.error('Unknown file type')
        }
    })
}

run('./test')