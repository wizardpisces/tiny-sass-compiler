/*
Produces production builds and stitches together d.ts files.
*/

const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const execa = require('execa')
const {
    gzipSync
} = require('zlib')
const {
    compress
} = require('brotli')

const args = require('minimist')(process.argv.slice(2))
const sourceMap  = true;

const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

const resolve = p => path.resolve(__dirname,'../', p)
const pkgDir = resolve('./')
const pkg = require(`${pkgDir}/package.json`)

run()

async function run() {
    await fs.remove(`${pkgDir}/dist`)
    await build()
    checkSize()
}

async function build() {
   

    const env = 'production'
    // try{

        await execa(
            'rollup',
            [
                '-c',
                '--environment',
                [
                    `COMMIT:${commit}`,
                    `NODE_ENV:${env}`,
                    `TYPES:true`,
                    sourceMap ? `SOURCE_MAP:true` : ``
                ]
                .filter(Boolean)
                .join(',')
            ], {
                stdio: 'inherit'
            }
        )
    // }catch(e){
    //     console.log('error rollup',__dirname,e)
    // }

    if (pkg.types) {
        console.log()
        console.log(
            chalk.bold(chalk.yellow(`Rolling up type definitions for tiny-sass-compiler...`))
        )

        // build types
        const {
            Extractor,
            ExtractorConfig
        } = require('@microsoft/api-extractor')

        const extractorConfigPath = path.resolve(pkgDir, `api-extractor.json`)
        const extractorConfig = ExtractorConfig.loadFileAndPrepare(
            extractorConfigPath
        )
        const extractorResult = Extractor.invoke(extractorConfig, {
            localBuild: true,
            showVerboseMessages: true
        })

        if (extractorResult.succeeded) {
            // concat additional d.ts to rolled-up dts
            const typesDir = path.resolve(pkgDir, 'types')
            if (await fs.exists(typesDir)) {
                const dtsPath = path.resolve(pkgDir, pkg.types)
                const existing = await fs.readFile(dtsPath, 'utf-8')
                const typeFiles = await fs.readdir(typesDir)
                const toAdd = await Promise.all(
                    typeFiles.map(file => {
                        return fs.readFile(path.resolve(typesDir, file), 'utf-8')
                    })
                )
                await fs.writeFile(dtsPath, existing + '\n' + toAdd.join('\n'))
            }
            console.log(
                chalk.bold(chalk.green(`API Extractor completed successfully.`))
            )
        } else {
            console.error(
                `API Extractor completed with ${extractorResult.errorCount} errors` +
                ` and ${extractorResult.warningCount} warnings`
            )
            process.exitCode = 1
        }

        await fs.remove(`${pkgDir}/dist/types`)
    }
}

function checkSize() {
    const target = pkg.name
    const pkgDir = path.resolve(__dirname,`./${target}`)
    checkFileSize(resolve(`dist/${target}.cjs.prod.js`))
}

function checkFileSize(filePath) {
    if (!fs.existsSync(filePath)) {
        return
    }
    const file = fs.readFileSync(filePath)
    const minSize = (file.length / 1024).toFixed(2) + 'kb'
    const gzipped = gzipSync(file)
    const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
    const compressed = compress(file)
    const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb'
    console.log(
        `${chalk.gray(
      chalk.bold(path.basename(filePath))
    )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
    )
}
