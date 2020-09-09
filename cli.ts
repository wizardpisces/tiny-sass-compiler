import {
    parse,
    compile
} from './src'

import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { CodegenResult } from '@/codegen';

function require_css(scssPath: string) {
    return {
        source: fs.readFileSync(scssPath, 'utf8'),
        filename: path.basename(scssPath)
    }
}
export interface RunOptions {
    genOtherInfo: boolean
    sourceMap: boolean
}

function run(
    sourceDir: string,
    outputDir: string = './',
    options: RunOptions = {
        genOtherInfo: false,
        sourceMap: false
    }
): void {

    let sourceDirLength = path.basename(sourceDir).length;

    if (!fs.existsSync(outputDir)) {
        mkdirp.sync(outputDir)
    }

    function render(filePath) {

        if (path.extname(filePath) !== '.scss') return;

        let requireCss = require_css(filePath),
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
            ast = parse(requireCss.source, requireCss)
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
            let compiled: CodegenResult;

            try {
                compiled = compile(requireCss.source, {
                    ...requireCss,
                    sourceDir: sourceDirname,
                    sourceMap: options.sourceMap
                })
            } catch (e) {
                console.log('Error source code path: ', filePath)
                console.log(e)
                return;
            }

            const { ast, map, code } = compiled;

            function writeResultCode(cb) {
                fs.writeFile(path.join(cssDistPath, basename + '.css'), (code), function (err) {
                    if (err) {
                        return console.error(`write css failed ${basename}`);
                    }
                    cb()
                })
            }

            function writeCodegenAst(cb) {
                fs.writeFile(path.join(codeGenAstDistPath, basename + '.json'), JSON.stringify(ast, null, 2), function (err) {
                    if (err) {
                        return console.error(`write transformed ast failed ${basename},\nError:${err}`);
                    }
                    cb()
                })
            }

            function writeSourceMap() {
                fs.writeFile(path.join(sourceMapDistPath, basename + '.css.map'), JSON.stringify(map, null, 2), function (err) {
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
        } else {
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
            // if (filename!== 'operator.scss') return;

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

export * from './src'

export {
    run
}