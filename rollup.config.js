import path from 'path'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'

const name = 'tiny-sass-compiler';
const resolve = p => path.resolve(__dirname, p)
const pkg = require(resolve(`package.json`))
const masterVersion = pkg.version
const packageOptions = pkg.buildOptions || {}

const outputConfigs = {
    cjs: {
        file: resolve(`dist/${name}.cjs.js`),
        format: `cjs`
    },
    'esm-bundler': {
        file: resolve(`dist/${name}.esm-bundler.js`),
        format: `es`
    },
}

const packageFormats = ['esm-bundler', 'cjs']
const packageConfigs =  []

if (process.env.NODE_ENV === 'production') {
    packageFormats.forEach(format => {
        packageConfigs.push(createProductionConfig(format))
        // packageConfigs.push(createMinifiedConfig(format))
    })
}

export default packageConfigs

function createConfig(format, output, plugins = []) {
    if (!output) {
        console.log(require('chalk').yellow(`invalid format: "${format}"`))
        process.exit(1)
    }

    output.sourcemap = !!process.env.SOURCE_MAP
    output.externalLiveBindings = false

    const shouldEmitDeclarations = process.env.TYPES != null
    // const shouldEmitDeclarations =false

    const tsPlugin = ts({
        useTsconfigDeclarationDir: true,
        check: process.env.NODE_ENV === 'production',
        tsconfig: resolve('tsconfig.json'),
        cacheRoot: resolve('node_modules/.rts2_cache'),
        tsconfigOverride: {
            compilerOptions: {
                sourceMap: output.sourcemap,
                declaration: shouldEmitDeclarations,
                // declarationMap: shouldEmitDeclarations,
                module: 'ESNext'
            },
            exclude: ['**/__tests__', 'test-dts'],
            include: ['src']
        }
    })

    const external = []
    const entryFile = resolve('index.ts')

    return {
        input: entryFile,
        external,
        plugins: [
            json({
                namedExports: false
            }),
            tsPlugin,
            createReplacePlugin(),
            ...plugins
        ],
        output,
        onwarn: (msg, warn) => {
            if (!/Circular/.test(msg)) {
                warn(msg)
            }
        }
    }
}

function createReplacePlugin() {
    const replacements = {
        __COMMIT__: `"${process.env.COMMIT}"`,
        __VERSION__: `"${masterVersion}"`
    }

    return replace(replacements)
}

function createProductionConfig(format) {
    return createConfig(format, {
        file: outputConfigs[format].file.replace(/\.js$/, '.prod.js'),
        format: outputConfigs[format].format
    })
}

function createMinifiedConfig(format) {
    const {
        terser
    } = require('rollup-plugin-terser')
    return createConfig(
        format, {
            file: outputConfigs[format].file.replace(/\.js$/, '.prod.js'),
            format: outputConfigs[format].format
        },
        [
            terser({
                module: /^esm/.test(format),
                compress: {
                    ecma: 2015,
                    pure_getters: true
                }
            })
        ]
    )
}
