const {
    superstruct
} = require('superstruct')

const {
    PRECEDENCE,
    is_operator,
    is_punc
} = require('./util')

const astTypeLiteralValidator = [
    'punc',
    'boolean',
    'str',
    'placeholder',
    'var',
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
    punc: {
        type: 'punc',
        value: 'puncValue'
    },

    boolean: {
        type: 'boolean',
        value: 'boolean'
    },
    str: {
        type: 'str',
        value: 'string'
    },
    placeholder: {
        type: 'placeholder',
        value: 'placeholderValue'
    },
    var: {
        type: 'var',
        value: 'string'
    },
    var_key: {
        type: 'var_key',
        value: 'string'
    },
    list: {
        type: 'list',
        // ast tree node must contains type property {type:'str',value:'1px solid red'}
        value: [constructDynamicStruct(['str', 'var', 'var_key', 'punc', 'binary'], 'list')]
    },
    binary: {
        type: 'binary',
        operator: 'operator',
        left: constructDynamicStruct(['str', 'var', 'binary'], 'binary'),
        right: constructDynamicStruct(['str', 'var', 'binary'], 'binary')
    },

    //Statement
    body: {
        type: 'body',
        children: [constructDynamicStruct(Statement_Types, 'body')]
    },

    '@import': {
        type: '@import',
        params: [constructDynamicStruct(['str'], '@import')]
    },

    assign: {
        type: 'assign',
        left: constructDynamicStruct(['str', 'var', 'var_key'], 'assign'),
        right: constructDynamicStruct(['list'], 'assign')
    },

    child: {
        type: 'child',
        // selector: str | placeholder | list,
        selector: constructDynamicStruct(['str', 'placeholder', 'list'], 'child'),
        children: [constructDynamicStruct(Statement_Types, 'child')]
    },

    '@include': {
        type: '@include',
        id: {
            type: "identifier",
            name: "string"
        },
        // args: [str | var | binary]
        args: [constructDynamicStruct(['str', 'var', 'binary', 'assign'], '@include')]
    },

    '@extend': {
        type: '@extend',
        // param: str | placeholder
        param: constructDynamicStruct(['str', 'placeholder'], '@extend'),
    },

    '@mixin': {
        type: '@mixin',
        id: {
            type: "identifier",
            name: 'string'
        },
        // params: [var | assign],
        params: [constructDynamicStruct(['var', 'assign'], '@mixin')],
        body: constructDynamicStruct(['body'], '@mixin')
    },

    '@error': {
        type: '@error',
        value: constructDynamicStruct(['list'], '@error')
    },

    IfStatement: {
        type: 'IfStatement',
        // test: str | var | binary | boolean,
        test: constructDynamicStruct(['str', 'var', 'binary', 'boolean'], 'IfStatement'),
        consequent: constructDynamicStruct(['body'], 'IfStatement'),
        //alternate: IfStatement | body | null
        alternate: constructDynamicStruct(['IfStatement', 'body', 'null'], 'IfStatement')
    },

    EachStatement: {
        type: 'EachStatement',
        left: constructDynamicStruct(['var'], 'EachStatement'),
        right: constructDynamicStruct(['var'], 'EachStatement'),
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