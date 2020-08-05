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
    genOtherInfo: false,
    sourceMap:false
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
            codeGenAstDistPath = path.join(outputDir, 'code-gen-ast', sourceDirname.substr(sourceDirLength)),
            sourceMapDistPath = path.join(outputDir, 'source-map', sourceDirname.substr(sourceDirLength)),
            cssDistPath = path.join(outputDir, 'css', sourceDirname.substr(sourceDirLength)),
            ast;
        
        if (!options.genOtherInfo) {
            if (!fs.existsSync(normalDistPath)) {
                mkdirp.sync(normalDistPath)
            }
            cssDistPath = normalDistPath
        } else {
            if (!fs.existsSync(cssDistPath)) {
                mkdirp.sync(cssDistPath)
            }
            if (!fs.existsSync(codeGenAstDistPath)) {
                mkdirp.sync(codeGenAstDistPath)
            }
            if (!fs.existsSync(astDistPath)) {
                mkdirp.sync(astDistPath)
            }
            if (!fs.existsSync(sourceMapDistPath)) {
                mkdirp.sync(sourceMapDistPath)
            }
        }

        try {
            ast = parse(source)
        } catch (e) {
            console.error(`\nParser Error:\n filePath: ${filePath}\n`, e)
            return;
        }

        function write_parsed_ast(cb) {
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
                
            try {
                compiled = compile(source, {
                    sourceDir:sourceDirname,
                    sourceMap:options.sourceMap
                })
            } catch (e) {
                console.log('Error source code path: ', filePath)
                console.log(e)
                return;
            }

            const {ast ,map , code} = compiled;

            function writeResultCode(cb){  
                fs.writeFile(path.join(cssDistPath, basename + '.css'), cssbeautify(code), function (err) {
                    if (err) {
                        return console.error(`write css failed ${basename}`);
                    }
                    cb()
                })
            }

            function writeCodegenAst(cb){
                fs.writeFile(path.join(codeGenAstDistPath, basename + '.json'), JSON.stringify(ast, null, 2), function (err) {
                    if (err) {
                        return console.error(`write transformed ast failed ${basename},\nError:${err}`);
                    }
                    cb()
                })
            }
            
            function writeSourceMap(){  
                fs.writeFile(path.join(sourceMapDistPath, basename + '.map'), JSON.stringify(map, null, 2), function (err) {
                    if (err) {
                        return console.error(`write source map failed ${basename}`);
                    }
                    console.log(`compile success ${basename}`)
                })
            }

            writeResultCode(() => {
                if (!options.genOtherInfo) {
                    return;
                }
                writeCodegenAst(() => {
                    writeSourceMap()
                })
            })
        }

        if (!options.genOtherInfo) {
            write_compiled()
        }else{
            write_parsed_ast(() => {
                write_compiled()
            })
        }
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