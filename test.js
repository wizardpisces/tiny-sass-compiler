const cssbeautify = require('cssbeautify');
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
    
    let testDirLength = path.basename(inputDir).length;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    function run_test(filePath) {

        if (path.extname(filePath) !== '.scss') return;

        let source = require_css(filePath),     
            basename = path.basename(filePath, '.scss'),
            sourceDirname = path.dirname(filePath),
            astDistPath = path.join(outputDir, 'ast', sourceDirname.substr(testDirLength)),
            cssDistPath = path.join(outputDir, 'css', sourceDirname.substr(testDirLength)),
            ast = parser(source);

        if (!fs.existsSync(astDistPath)) {
            fs.mkdirSync(astDistPath, { recursive: true })
        }
        if (!fs.existsSync(cssDistPath)) {
            fs.mkdirSync(cssDistPath, { recursive: true })
        }

        function write_ast(cb) {
            fs.writeFile(path.join(astDistPath, basename + '.json'), JSON.stringify(ast, null, 2), function (err) {
                if (err) {
                    console.error(err)
                    return console.error(`parse failed ${basename}`);
                }
                cb()
            })
        }

        function write_compiled() {
            let compiled = null;
            try{
                compiled = compiler(ast, path.join(__dirname,sourceDirname))
            }catch(e){
                console.log('Error path: ',path.join(__dirname, sourceDirname))
                console.log(e)
                return;
            }

            fs.writeFile(path.join(cssDistPath, basename + '.css'), cssbeautify(compiled), function (err) {
                if (err) {
                    return console.error(`compile failed ${basename}`);
                }
                console.log(`compile success ${basename}`)
            })
        }

        write_ast(()=>{
            write_compiled()
        })
    }

    function walk(currentDir){
        fs.readdirSync(currentDir).forEach((filename)=>{
            //Todos Only analyze filename without '_'
            if(filename.startsWith('_')){
                return;
            }

            // console.log(filename)

            // if (filename !== 'flow-control' && filename !== 'else-if.scss') return;

            let filePath = path.join(currentDir, filename),
                stat = fs.lstatSync(filePath)
            if (stat.isFile()) {
                return run_test(filePath)
            }else if(stat.isDirectory()){
                walk(filePath)
            }else{
                console.error('Unknown file type')
            }
        })
    }

    walk(inputDir)

}

run('./test')