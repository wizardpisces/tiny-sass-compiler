import { CodegenContext } from '@/type'

export class Tree {
    constructor(){
    }

    @deprecate()
    genCSS(context: CodegenContext){

    }
    toJSON(){

    }
}

/**
 * decorator will run at compile time so it should only prompt once
 * it would be too noise if used with runtime action 
 */
export function deprecate() {
    return function (target, name, descriptor) {
        console.warn(`[Tree]: ${name} will be deprecated!!!`)
    }
}