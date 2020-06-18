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
    'boolean',
    NodeTypes.TEXT,
    'placeholder',
    NodeTypes.VARIABLE,
    'var_key',
    'list',
    'binary',
    'identifier',

    'body',
    'assign',
    'child',
    '@import',
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
    start: 'number?',
    end: 'number?'
}

/**
 * acceptTypes: string[]
 * typePath: string
 */
const Statement_Types = ['body', 'assign', 'child', '@import', '@include', '@extend', '@mixin', '@error', 'EachStatement', 'IfStatement']

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

    boolean: {
        type: 'boolean',
        value: 'boolean'
    },
    [NodeTypes.TEXT]: {
        type: NodeTypes.TEXT,
        value: 'string'
    },
    placeholder: {
        type: 'placeholder',
        value: 'placeholderValue'
    },
    [NodeTypes.VARIABLE]: {
        type: NodeTypes.VARIABLE,
        value: 'string'
    },
    var_key: {
        type: 'var_key',
        value: 'string'
    },
    list: {
        type: 'list',
        // ast tree node must contains type property {type:NodeTypes.TEXT,value:'1px solid red'}
        value: [constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, 'var_key', NodeTypes.PUNC, 'binary'], 'list')]
    },
    binary: {
        type: 'binary',
        operator: 'operator',
        left: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, 'binary'], 'binary'),
        right: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, 'binary'], 'binary')
    },

    //Statement
    body: {
        type: 'body',
        children: [constructDynamicStruct(Statement_Types, 'body')]
    },

    '@import': {
        type: '@import',
        params: [constructDynamicStruct([NodeTypes.TEXT], '@import')]
    },

    assign: {
        type: 'assign',
        left: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, 'var_key'], 'assign'),
        right: constructDynamicStruct(['list'], 'assign')
    },

    child: {
        type: 'child',
        // selector: str | placeholder | list,
        selector: constructDynamicStruct([NodeTypes.TEXT, 'placeholder', 'list'], 'child'),
        children: [constructDynamicStruct(Statement_Types, 'child')]
    },

    '@include': {
        type: '@include',
        id: {
            type: "identifier",
            name: "string"
        },
        // args: [str | var | binary]
        args: [constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, 'binary', 'assign'], '@include')]
    },

    '@extend': {
        type: '@extend',
        // param: str | placeholder
        param: constructDynamicStruct([NodeTypes.TEXT, 'placeholder'], '@extend'),
    },

    '@mixin': {
        type: '@mixin',
        id: {
            type: "identifier",
            name: 'string'
        },
        // params: [var | assign],
        params: [constructDynamicStruct([NodeTypes.VARIABLE, 'assign'], '@mixin')],
        body: constructDynamicStruct(['body'], '@mixin')
    },

    '@error': {
        type: '@error',
        value: constructDynamicStruct(['list'], '@error')
    },

    IfStatement: {
        type: 'IfStatement',
        // test: str | var | binary | boolean,
        test: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, 'binary', 'boolean'], 'IfStatement'),
        consequent: constructDynamicStruct(['body'], 'IfStatement'),
        //alternate: IfStatement | body | null
        alternate: constructDynamicStruct(['IfStatement', 'body', 'null'], 'IfStatement')
    },

    EachStatement: {
        type: 'EachStatement',
        left: constructDynamicStruct([NodeTypes.VARIABLE], 'EachStatement'),
        right: constructDynamicStruct([NodeTypes.VARIABLE], 'EachStatement'),
        body: constructDynamicStruct(['child'], 'EachStatement')
    },
    Prog: {
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