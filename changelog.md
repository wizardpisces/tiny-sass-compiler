# [0.11.0](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.10.0...v0.11.0) (2021-01-19)


### bugfix

* ll(n) check different : scenario([c815dee](https://github.com/wizardpisces/tiny-sass-compiler/commit/c815deedb3dbdf634885e886ee1f06a696df39e4))


### chore 

* add @use circular check([fe8a3d1](https://github.com/wizardpisces/tiny-sass-compiler/commit/fe8a3d1fa48d7f697faa5e3a9af87aa56ab7c2b1))
* change package.json version([50c313b](https://github.com/wizardpisces/tiny-sass-compiler/commit/50c313b293bbaf190497d833f60cb596f7bb021e))
* merge breaked @media([15d903f](https://github.com/wizardpisces/tiny-sass-compiler/commit/15d903fa7c0b07361b1c6131981e24d8d6a203a7))
* not stable, add ts to lexical and input_stream , also create a bug([a42fb6c](https://github.com/wizardpisces/tiny-sass-compiler/commit/a42fb6c0ffcc367886032810779415458a77273e))
* optimize @use and IdentifierNode([edd67bd](https://github.com/wizardpisces/tiny-sass-compiler/commit/edd67bdf941868de4f4eb5192336a4a2a4fb33a8))
* optimize ast traverse plugin([8c29d53](https://github.com/wizardpisces/tiny-sass-compiler/commit/8c29d534c09698591d6a937e0b691df451ec8d46))
* optimize source map filename([0f74753](https://github.com/wizardpisces/tiny-sass-compiler/commit/0f7475380619c6040f3e1d731fe04032d3bd91b3))
* remove unnecessary dependencies([0cfe9e4](https://github.com/wizardpisces/tiny-sass-compiler/commit/0cfe9e4739340d5179a089f1a3fb6c00a6f30959))


### feat

* add @use keyword; Todos: parse and interpret namespace([6f31965](https://github.com/wizardpisces/tiny-sass-compiler/commit/6f31965e0a4167a566b9c10345be50606104cd7a))
* add basic @keyframes([30ceff2](https://github.com/wizardpisces/tiny-sass-compiler/commit/30ceff2625c2c1a40ccd034d634144a5bc00e5cd))
* add comment parse([9c972d9](https://github.com/wizardpisces/tiny-sass-compiler/commit/9c972d98f1892b9968dc3b051c1ba3ed5386e468))
* add keyword @content([c06d469](https://github.com/wizardpisces/tiny-sass-compiler/commit/c06d4691a5b738722b9b6f5b030dcec731af20d0))
* add more interface for plugin manager([5cf1dbf](https://github.com/wizardpisces/tiny-sass-compiler/commit/5cf1dbf82bc0aae418343d64f31f65c5bd4b1755))
* add render,renderSync API([a975d9a](https://github.com/wizardpisces/tiny-sass-compiler/commit/a975d9aeafb10f27b977041d1837feb42d480170))
* add transform runtime plugin([973b329](https://github.com/wizardpisces/tiny-sass-compiler/commit/973b329763bf0c3faaf590197e80b286090d80ca))
* finish basic @use([8481285](https://github.com/wizardpisces/tiny-sass-compiler/commit/8481285bd61b0643c752826687a27adc2f5e8218))
* start add use module ing([7072409](https://github.com/wizardpisces/tiny-sass-compiler/commit/7072409711b859a72e53461f2c9fb515cb53caad))


### refactor

* code optimize([0e2845e](https://github.com/wizardpisces/tiny-sass-compiler/commit/0e2845e8b524e734bf5d1fc401ea0d4b841156f6))
* replace genCSS with genCodeVisitor which reuse traverse visitor mode([9d887f3](https://github.com/wizardpisces/tiny-sass-compiler/commit/9d887f3d4121ded222835e1260bb1479db6824ed))
* simplify transform([6eb3c68](https://github.com/wizardpisces/tiny-sass-compiler/commit/6eb3c680423640b3c6bb17e985099f141b22da24))
* use traverse plugin to generate css([78462f5](https://github.com/wizardpisces/tiny-sass-compiler/commit/78462f5b6373e3fb8e0d99f4c26662712d5d7428))


### Refactor

* refactor enviroment mainly to differentiate variable kind([a5c117a](https://github.com/wizardpisces/tiny-sass-compiler/commit/a5c117ac7e155b063b82008ad0968a32ae37665c))




# [0.10.0](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.9...v0.10.0) (2020-11-13)


### chore

* add AtRule prototype and media ast and other refactor([afd5863](https://github.com/wizardpisces/tiny-sass-compiler/commit/afd586378755e7c25b60629228609d04d2ef070c))
* change file name([e88f1ff](https://github.com/wizardpisces/tiny-sass-compiler/commit/e88f1ff86e86c2c128bd52cd06265844d367053b))


### feat

* add @media and url internal call support([d8b6857](https://github.com/wizardpisces/tiny-sass-compiler/commit/d8b6857a9b29aedaa7298a6a6dee40dfed8c197f))
* add travesal plugin API([5fe01c7](https://github.com/wizardpisces/tiny-sass-compiler/commit/5fe01c7e9157c732b9620d605caad262c5c23461))


### feature

* add @media buble([0b039dd](https://github.com/wizardpisces/tiny-sass-compiler/commit/0b039dd10899d65beae3a543e03b60f10409da74))
* add partial @media bubble([dba1e3a](https://github.com/wizardpisces/tiny-sass-compiler/commit/dba1e3a62a497dedc28ae04725e790065d3facac))


### refactor

* bugfix and extract types([f491999](https://github.com/wizardpisces/tiny-sass-compiler/commit/f491999e70f3ae2b9fd0c76b8e263bcd0eab77fb))
* extract codegen to tree([fb4ded6](https://github.com/wizardpisces/tiny-sass-compiler/commit/fb4ded6a955b3a5fe7e8e7174785643dca3cc35d))




## [0.8.9](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.8...v0.8.9) (2020-09-23)




## [0.8.8](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.7...v0.8.8) (2020-09-23)




## [0.8.7](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.5...v0.8.7) (2020-09-23)




## [0.8.5](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.4...v0.8.5) (2020-09-17)




## [0.8.4](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.3...v0.8.4) (2020-09-15)




## [0.8.3](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.1...v0.8.3) (2020-09-09)




## [0.8.1](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.8.0...v0.8.1) (2020-09-09)




# [0.8.0](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.7.3...v0.8.0) (2020-09-09)




## [0.7.3](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.7.1...v0.7.3) (2020-09-08)




## [0.7.1](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.7.0...v0.7.1) (2020-09-07)


### feat

* add production builder([7a8520d](https://github.com/wizardpisces/tiny-sass-compiler/commit/7a8520d934b588f4f814b2a26ad0e0e7ddb7ec70))




# [0.7.0](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.6.3...v0.7.0) (2020-08-18)


### feat

* add partial sourceMap([181db13](https://github.com/wizardpisces/tiny-sass-compiler/commit/181db13f44c9f27e5fbadb9accc624e95e651266))
* add sourceMap and jest (unfinished)([94c4239](https://github.com/wizardpisces/tiny-sass-compiler/commit/94c423964e6428e2bd173f33580d8faf068831ba))
* refactor parse transform_module index to ts, add feature @import sourcemap([0762ec1](https://github.com/wizardpisces/tiny-sass-compiler/commit/0762ec1e6e19d0547afaf580b3c9bcd49e8d9632))


### refactor

* ,adjust assign and binary position([afb47f9](https://github.com/wizardpisces/tiny-sass-compiler/commit/afb47f999700f6719b414fc6eb755731d33b0f19))
* self beautify css([d335e35](https://github.com/wizardpisces/tiny-sass-compiler/commit/d335e358ee15f746d4d58ae2a1688206484027e2))


### test

* add property, @extend , selector sourceMap test([35acf45](https://github.com/wizardpisces/tiny-sass-compiler/commit/35acf4575c23a35079603d9cedbb792813e91bf6))




## [0.6.3](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.5.1...v0.6.3) (2020-07-02)


### docs

* change readme([4fde6f0](https://github.com/wizardpisces/tiny-sass-compiler/commit/4fde6f074253adf6c258e0792492cdaa67fbf493))


### refactor

* code structure([7091001](https://github.com/wizardpisces/tiny-sass-compiler/commit/709100153586989b6e31b8a63d09305bf87d0e42))
* make transform plugins([74b238f](https://github.com/wizardpisces/tiny-sass-compiler/commit/74b238f71e800764b2b6bd6bf9957c554c5ef952))
* split expression and statement transform([31b23e6](https://github.com/wizardpisces/tiny-sass-compiler/commit/31b23e6440dee7d17596a739f223349b86373fba))
* tranform plugins([243320d](https://github.com/wizardpisces/tiny-sass-compiler/commit/243320d378bec7c585347100ada85ac3432fcdbc))




## [0.5.1](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.5.0...v0.5.1) (2020-06-23)




# [0.5.0](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.4.3...v0.5.0) (2020-06-22)




## [0.4.3](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.4.1...v0.4.3) (2020-06-18)




## [0.4.1](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.4.0...v0.4.1) (2020-06-18)




# [0.4.0](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.3.1...v0.4.0) (2020-06-18)




## [0.3.1](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.3.0...v0.3.1) (2020-06-08)




# [0.3.0](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.2.5...v0.3.0) (2020-06-08)




## [0.2.5](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.2.4...v0.2.5) (2020-06-04)




## [0.2.4](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.1.4...v0.2.4) (2020-06-03)




## [0.1.4](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.1.3...v0.1.4) (2020-05-27)




## [0.1.3](https://github.com/wizardpisces/tiny-sass-compiler/compare/v0.1.1...v0.1.3) (2020-05-27)




## [0.1.1](https://github.com/wizardpisces/tiny-sass-compiler/compare/2bb1405d2e8d53f325a6dc8fa03eef0420339539...v0.1.1) (2020-05-27)


### bugfix

* fix extend class logic([2bb1405](https://github.com/wizardpisces/tiny-sass-compiler/commit/2bb1405d2e8d53f325a6dc8fa03eef0420339539))


### feat

* add keyword @each ,  fix: transform_nest([bfad4d6](https://github.com/wizardpisces/tiny-sass-compiler/commit/bfad4d6e76751bb4debac0f64ca9c2e1d2376322))


### feature

* add basic IfStatement([e3d5f3e](https://github.com/wizardpisces/tiny-sass-compiler/commit/e3d5f3e75f2f5af97eba529ff084fed7bb3d3110))
* add IfStatement, keywords:@if @else @error([dbcaf8d](https://github.com/wizardpisces/tiny-sass-compiler/commit/dbcaf8d1b2fec740e36b51cf7261fa45c74e312c))
* add keyword @import , oonly support basic @import for now([f7a0263](https://github.com/wizardpisces/tiny-sass-compiler/commit/f7a0263f73eebae2cc454f7855f06681b0890b33))
* add mixins optional params and parent selector([66de562](https://github.com/wizardpisces/tiny-sass-compiler/commit/66de5626caed4229a291af767c27807e50131ba5))
* add npm([2c6a6d8](https://github.com/wizardpisces/tiny-sass-compiler/commit/2c6a6d83bb7ca6247412e9facfdc0aaf435cccc8))
* add support for @mixin optional params([dba57cb](https://github.com/wizardpisces/tiny-sass-compiler/commit/dba57cb77e1dd5f105cf46d397b6bd622e568fe4))
* optimize parser for keywords @mixin @include([e27ce29](https://github.com/wizardpisces/tiny-sass-compiler/commit/e27ce29883ba62147bbf02061f6915a2669c983c))
* optimize transformer and compiler to support @mixin and @include([a0c8f5a](https://github.com/wizardpisces/tiny-sass-compiler/commit/a0c8f5ad6b9b16c021e9728692f462e13d618a0a))
* partially add start and end property to ast([1e553bb](https://github.com/wizardpisces/tiny-sass-compiler/commit/1e553bb0397136693c51d6387a8e9b3e00c37948))


### fix

* @mixin @include without tailor (([a925fef](https://github.com/wizardpisces/tiny-sass-compiler/commit/a925fef59e47db7d46deb6ccd571878c207cbc4d))


### refactor

* add css test result beautify([7105926](https://github.com/wizardpisces/tiny-sass-compiler/commit/7105926053f19a42080fef9ec1caa214db030c39))
* optimize code([742129b](https://github.com/wizardpisces/tiny-sass-compiler/commit/742129b2945e948385b8e13c1395c3d3d0c7829d))
* optimize Token([0ba01a8](https://github.com/wizardpisces/tiny-sass-compiler/commit/0ba01a8f12449a27608bf5db0fab251dcfb7ba65))
* rewrite test input and output([6199dd2](https://github.com/wizardpisces/tiny-sass-compiler/commit/6199dd202edd2144b5787d1fa15282aa02493173))
* str lexical parse upgrade([52f9fdf](https://github.com/wizardpisces/tiny-sass-compiler/commit/52f9fdfc04cccef0e6369ea9ed9232c0aac8a669))
* whitespace optimization based on position(start, end)([761b73a](https://github.com/wizardpisces/tiny-sass-compiler/commit/761b73a3f86602ee61cd1fc55f72f75ae060bd00))



