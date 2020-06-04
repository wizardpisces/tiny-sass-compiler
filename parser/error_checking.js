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

function constructDynamicStruct(acceptTypes = [], typePath = '') {

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
            throw `\n ParentPath: ${typePath} \n Path: ${path} \n Expect oneOf ${acceptTypes} but received ${value.type}\n`
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
        value: [constructDynamicStruct(['str', 'var', 'var_key', 'punc', 'binary'], 'list->value')]
    },
    binary: {
        type: 'binary',
        operator: 'operator',
        left: constructDynamicStruct(['str', 'var', 'binary'], 'binary->left'),
        right: constructDynamicStruct(['str', 'var', 'binary'], 'binary-right')
    },

    //Statement
    body: {
        type: 'body',
        children: [constructDynamicStruct(Statement_Types, 'body->value')]
    },

    '@import': {
        type: '@import',
        params: [constructDynamicStruct(['str'], '@import->str')]
    },

    assign: {
        type: 'assign',
        left: constructDynamicStruct(['str', 'var', 'var_key'], 'assign->left'),
        right: constructDynamicStruct(['list'], 'assign->right')
    },

    child: {
        type: 'child',
        // selector: str | placeholder | list,
        selector: constructDynamicStruct(['str', 'placeholder', 'list'], 'child->selector'),
        children: [constructDynamicStruct(Statement_Types, 'child->children')]
    },

    '@include': {
        type: '@include',
        id: {
            type: "identifier",
            name: "string"
        },
        // args: [str | var | binary]
        args: [constructDynamicStruct(['str', 'var', 'binary', 'assign'], '@include->args')]
    },

    '@extend': {
        type: '@extend',
        // param: str | placeholder
        param: constructDynamicStruct(['str', 'placeholder'], '@extend->param'),
    },

    '@mixin': {
        type: '@mixin',
        id: {
            type: "identifier",
            name: 'string'
        },
        // params: [var | assign],
        params: [constructDynamicStruct(['var', 'assign'], '@mixin->args')],
        body: constructDynamicStruct(['body'], '@mixin->body')
    },

    '@error': {
        type: '@error',
        value: constructDynamicStruct(['list'], '@error->valye')
    },

    IfStatement: {
        type: 'IfStatement',
        // test: str | var | binary | boolean,
        test: constructDynamicStruct(['str', 'var', 'binary', 'boolean'], 'IfStatement->test'),
        consequent: constructDynamicStruct(['body'], 'IfStatement->consequent'),
        //alternate: IfStatement | body | null
        alternate: constructDynamicStruct(['IfStatement', 'body', 'null'], 'IfStatement->alternate')
    },

    EachStatement: {
        type: 'EachStatement',
        left: constructDynamicStruct(['var'], 'EachStatement->left'),
        right: constructDynamicStruct(['var'], 'EachStatement->right'),
        body: constructDynamicStruct(['child'], 'EachStatement->body')
    },
    Prog: {
        type: 'prog',
        prog: [constructDynamicStruct(Statement_Types, 'Prog->prog')]
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
        // const {
        //     path,
        //     value,
        //     type
        // } = e
        // console.error(`\nAST check failed: \n filePath: ${filePath} \n schemaPath: ${path}\n msg: expect type ${type} but received ${value}\n`)
        throw e
    }

    return ast;
}