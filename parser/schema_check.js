const {
    superstruct
} = require('superstruct')
import { NodeTypes }  from './ast';

const {
    PRECEDENCE,
    is_operator,
    is_punc
} = require('./util')

const astTypeLiteralValidator = [
    NodeTypes.PUNC,
    NodeTypes.TEXT,
    NodeTypes.PLACEHOLDER,
    NodeTypes.VARIABLE,
    NodeTypes.VAR_KEY,
    NodeTypes.LIST,
    NodeTypes.BINARY,
    'identifier',

    NodeTypes.BODY,
    'assign',
    'child',
    NodeTypes.IMPORT,
    '@include',
    '@extend',
    '@mixin',
    '@error',
    'IfStatement',
    'EachStatement',

    'prog'
].reduce((typeObj, type) => {
    typeObj[type] = (val) => val === type;
    return typeObj;
}, {})

const customStruct = superstruct({
    types: Object.assign({
        operation: (val) => Object.keys(PRECEDENCE).indexOf(val) > 0,
        operator: (val) => is_operator(val),
        puncValue: (val) => is_punc(val),
        placeholderValue: (val) => /^%.+$/.test(val)
    }, astTypeLiteralValidator)
})

const baseSchema = {
    // start: 'number?',
    // end: 'number?',
    loc: customStruct.optional({
        start:{
            line:'number',
            column:'number',
            offset:'number'
        },
        end:{
            line:'number',
            column:'number',
            offset:'number'
        }
    })
}

/**
 * acceptTypes: string[]
 * typePath: string
 */
const Statement_Types = [NodeTypes.BODY, 'assign', 'child', NodeTypes.IMPORT, '@include', '@extend', '@mixin', '@error', 'EachStatement', 'IfStatement']

function constructDynamicStruct(acceptTypes = [], parentPath = '') {

    if (typeof acceptTypes === 'string') {
        acceptTypes = [acceptTypes]
    }

    return customStruct.dynamic((value, branch, path) => {
        // pure literal null
        if (value === null && acceptTypes.includes('null')) {
            return customStruct('null');
        }

        // Expression or Statement with type
        if (!acceptTypes.includes(value.type)) {
            // console.log(branch)
            throw `astPath ${[parentPath].concat(path).join('->')} expect oneOf ${acceptTypes} but received ${JSON.stringify(value)}\n`
        }

        return Type_Struct_Map[value.type]
    })
}

let Type_Schema_Map = {
    // Expression
    [NodeTypes.PUNC]: {
        type: NodeTypes.PUNC,
        value: 'puncValue'
    },

    [NodeTypes.TEXT]: {
        type: NodeTypes.TEXT,
        value: 'string'
    },
    [NodeTypes.PLACEHOLDER]: {
        type: NodeTypes.PLACEHOLDER,
        value: 'placeholderValue'
    },
    [NodeTypes.VARIABLE]: {
        type: NodeTypes.VARIABLE,
        value: 'string'
    },
    [NodeTypes.VAR_KEY]: {
        type: NodeTypes.VAR_KEY,
        value: 'string'
    },
    [NodeTypes.LIST]: {
        type: NodeTypes.LIST,
        // ast tree node must contains type property {type:NodeTypes.TEXT,value:'1px solid red'}
        value: [constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.VAR_KEY, NodeTypes.PUNC, NodeTypes.BINARY], NodeTypes.LIST)]
    },
    [NodeTypes.BINARY]: {
        type: NodeTypes.BINARY,
        operator: 'operator',
        left: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.BINARY], NodeTypes.BINARY),
        right: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.BINARY], NodeTypes.BINARY)
    },

    //Statement
    [NodeTypes.BODY]: {
        type: NodeTypes.BODY,
        children: [constructDynamicStruct(Statement_Types, NodeTypes.BODY)]
    },

    [NodeTypes.IMPORT]: {
        type: NodeTypes.IMPORT,
        params: [constructDynamicStruct([NodeTypes.TEXT], NodeTypes.IMPORT)]
    },

    'assign': {
        type: 'assign',
        left: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.VAR_KEY], 'assign'),
        right: constructDynamicStruct([NodeTypes.LIST], 'assign')
    },

    'child': {
        type: 'child',
        // selector: str | placeholder | list,
        selector: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.PLACEHOLDER, NodeTypes.LIST], 'child'),
        children: [constructDynamicStruct(Statement_Types, 'child')]
    },

    '@include': {
        type: '@include',
        id: {
            type: "identifier",
            name: "string"
        },
        // args: [str | var | binary]
        args: [constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.BINARY, 'assign'], '@include')]
    },

    '@extend': {
        type: '@extend',
        // param: str | placeholder
        param: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.PLACEHOLDER], '@extend'),
    },

    '@mixin': {
        type: '@mixin',
        id: {
            type: "identifier",
            name: 'string'
        },
        // params: [var | assign],
        params: [constructDynamicStruct([NodeTypes.VARIABLE, 'assign'], '@mixin')],
        body: constructDynamicStruct([NodeTypes.BODY], '@mixin')
    },

    '@error': {
        type: '@error',
        value: constructDynamicStruct([NodeTypes.LIST], '@error')
    },

    'IfStatement': {
        type: 'IfStatement',
        test: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.BINARY], 'IfStatement'),
        consequent: constructDynamicStruct([NodeTypes.BODY], 'IfStatement'),
        //alternate: IfStatement | body | null
        alternate: constructDynamicStruct(['IfStatement', NodeTypes.BODY, 'null'], 'IfStatement')
    },

    'EachStatement': {
        type: 'EachStatement',
        left: constructDynamicStruct([NodeTypes.VARIABLE], 'EachStatement'),
        right: constructDynamicStruct([NodeTypes.VARIABLE], 'EachStatement'),
        body: constructDynamicStruct(['child'], 'EachStatement')
    },
    'Prog': {
        type: 'prog',
        prog: [constructDynamicStruct(Statement_Types, 'Prog')]
    }

};


const Type_Struct_Map = Object.keys(Type_Schema_Map).reduce((resultMap, type) => {
    resultMap[type] = customStruct(Object.assign(Type_Schema_Map[type], baseSchema))
    return resultMap;
}, {})

module.exports = function error_checking(ast) {
    try {
        Type_Struct_Map['Prog'](ast);
    } catch (e) {
        throw e
    }

    return ast;
}