import cssbeautify from 'cssbeautify'
import compile, {
    parse
} from './src'
import fs from 'fs';
import path from 'path'
import mkdirp from 'mkdirp'

function require_css(path) {
    return fs.readFileSync(path, 'utf8')
}

function run(sourceDir, outputDir = './', options = {
    generateAstFile: false
}) {

    let sourceDirLength = path.basename(sourceDir).length;

    if (!fs.existsSync(outputDir)) {
        mkdirp.sync(outputDir)
    }

    function render(filePath) {

        if (path.extname(filePath) !== '.scss') return;

        let source = require_css(filePath),
            basename = path.basename(filePath, '.scss'),
            sourceDirname = path.dirname(filePath),
            normalDistPath = path.join(outputDir, sourceDirname.substr(sourceDirLength)),
            astDistPath = path.join(outputDir, 'ast', sourceDirname.substr(sourceDirLength)),
            cssDistPath = path.join(outputDir, 'css', sourceDirname.substr(sourceDirLength)),
            ast;

        try{
            ast = parse(source)
        }catch(e){
            console.error(`\nParser Error:\n filePath: ${filePath}\n`,e)
            return;
        }    

        function write_ast(cb) {
            if (!options.generateAstFile) {
                return cb()
            }
            if (!fs.existsSync(astDistPath)) {
                mkdirp.sync(astDistPath)
            }
            fs.writeFile(path.join(astDistPath, basename + '.json'), JSON.stringify(ast, null, 2), function (err) {
                if (err) {
                    console.error(err)
                    return console.error(`parse failed ${basename}`);
                }
                cb()
            })
        }

        function write_compiled() {
            let compiled = null,
                outputDir;
                
            try {
                compiled = compile(source, {
                    sourceDir:sourceDirname
                })
            } catch (e) {
                console.log('Error path: ', filePath)
                console.log(e)
                return;
            }

            if (!options.generateAstFile) {
                if (!fs.existsSync(normalDistPath)) {
                    mkdirp.sync(normalDistPath)
                }
                outputDir = normalDistPath
            } else {
                if (!fs.existsSync(cssDistPath)) {
                    mkdirp.sync(cssDistPath)
                }
                outputDir = cssDistPath
            }

            function writeResultAst(cb){
                fs.writeFile(path.join(outputDir, basename + '.json'), JSON.stringify(compiled.ast, null, 2), function (err) {
                    if (err) {
                        return console.error(`write transformed ast failed ${basename}`);
                    }
                    cb()
                })
            }

            function writeResultCode(){  
                fs.writeFile(path.join(outputDir, basename + '.css'), cssbeautify(compiled.code), function (err) {
                    if (err) {
                        return console.error(`write css failed ${basename}`);
                    }
                    console.log(`compile success ${basename}`)
                })
            }

            writeResultAst(writeResultCode)
        }

        write_ast(() => {
            write_compiled()
        })
    }

    function renderDir(sourceDir) {
        fs.readdirSync(sourceDir).forEach((filename) => {
            //Todos Only analyze filename without '_'
            if (filename.startsWith('_')) {
                return;
            }

            // if (filename!== 'flow-control' &&  filename !== 'each' && filename !=='each.scss') return;
            // if (filename!== 'var-simple.scss') return;

            let filePath = path.join(sourceDir, filename),
                stat = fs.lstatSync(filePath)
            if (stat.isFile()) {
                return render(filePath)
            } else if (stat.isDirectory()) {
                renderDir(filePath)
            } else {
                console.error('Unknown file type')
            }
        })
    }

    renderDir(sourceDir)

}

module.exports = run;