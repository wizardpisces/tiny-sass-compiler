import parse from './parse'

// transformChain will be slowly replaced by transform plugins
import transformChain from './transform/index'

// import { transform} from './transform'

import {generate} from './codegen'

export default (scss:string, sourceDir:string) => generate(transformChain( parse(scss), sourceDir ) )