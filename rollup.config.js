import path from 'path'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
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

    global: {
        file: resolve(`dist/${name}.global.js`),
        format: `iife`
    },

    // browser distribution
    'esm-browser': {
        file: resolve(`dist/${name}.esm-browser.js`),
        format: `es`
    },
    'cjs-browser': {
        file: resolve(`dist/${name}.cjs-browser.js`),
        format: `cjs`
    }
}

const packageFormats = Object.keys(outputConfigs);
const packageConfigs = []

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

    const isBrowserESMBuild = /browser/.test(format)
    const isGlobalBuild = /global/.test(format)
    const isBrowserBuild = isBrowserESMBuild | isGlobalBuild
    
    output.sourcemap = false
    output.externalLiveBindings = false

    if(isGlobalBuild){
        output.name = 'tinySassCompiler'
    }
    
    const shouldEmitDeclarations = process.env.TYPES != null
    // const shouldEmitDeclarations =false
    

    const tsPlugin = ts({
        useTsconfigDeclarationDir: true,
        check: process.env.NODE_ENV === 'production',
        tsconfig: resolve('tsconfig.json'),
        /**
         * caution:
         * 
         * clean set to true to avoid cache not track dependency which is not 100 % right
         * in circumstance when change enum order, another dependent file keep the old order if not modified
         */
        // clean: true,
        cacheRoot: resolve('node_modules/.rts2_cache'),
        tsconfigOverride: {
            compilerOptions: {
                sourceMap: output.sourcemap,
                declaration: shouldEmitDeclarations,
                // declarationMap: shouldEmitDeclarations,
                module: 'ESNext' // when build for production, do not compile module, leave it to rollup
            },
            exclude: ['**/__tests__', 'test-dts'],
            include: ['src']
        }
    })

    const nodePlugins = [
        nodeResolve({
            preferBuiltins: true
        }),
        require('@rollup/plugin-commonjs')({
            sourceMap: false
        })
    ]

    const external = isBrowserBuild ? ['fs', 'path'] : ['fs', 'path', 'util']; // node build externalize system package
    const entryFile = isBrowserBuild ? resolve('src/index.ts') : resolve('cli.ts')

    return {
        input: entryFile,
        external,
        plugins: [
            json({
                namedExports: false
            }),
            tsPlugin,
            createReplacePlugin(isBrowserBuild),
            ...nodePlugins,
            ...plugins
        ],
        output,
        onwarn: (msg, warn) => {
            if (!/Circular/.test(msg)) {
                warn(msg)
            }
        },
        treeshake: {
            moduleSideEffects: false
        }
    }
}

function createReplacePlugin(isBrowserBuild) {
    const replacements = {
        __COMMIT__: `"${process.env.COMMIT}"`,
        __VERSION__: `"${masterVersion}"`,
        __BROWSER__: isBrowserBuild
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