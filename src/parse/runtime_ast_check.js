import {
    superstruct,object,string
} from 'superstruct'
import { NodeTypes }  from './ast';

import {
    PRECEDENCE,
    is_operator,
    is_punc
} from './util'

const astTypeLiteralValidator = [
    NodeTypes.PUNC,
    NodeTypes.TEXT,
    NodeTypes.PLACEHOLDER,
    NodeTypes.VARIABLE,
    NodeTypes.VAR_KEY,
    NodeTypes.LIST,
    NodeTypes.BINARY,
    NodeTypes.IDENTIFIER,

    NodeTypes.BODY,
    NodeTypes.DECLARATION,
    NodeTypes.RULE,
    NodeTypes.IMPORT,
    NodeTypes.INCLUDE,
    NodeTypes.EXTEND,
    NodeTypes.MIXIN,
    NodeTypes.ERROR,
    NodeTypes.IFSTATEMENT,
    NodeTypes.EACHSTATEMENT,

    NodeTypes.PROGRAM
].reduce((typeObj, type) => {
    typeObj[type] = (val) => val === type;
    return typeObj;
}, {})

const customStruct = superstruct({
    types: Object.assign({
        operation: (val) => Object.keys(PRECEDENCE).indexOf(val) > 0,
        operator: (val) => val.type === NodeTypes.OPERATOR && is_operator(val.value),
        puncValue: (val) => is_punc(val),
        placeholderValue: (val) => /^%.+$/.test(val)
    }, astTypeLiteralValidator)
})

const baseSchema = {
    // start: 'number?',
    // end: 'number?',
    loc: customStruct.optional({
        filename: 'string',
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
const Statement_Types = [
    NodeTypes.BODY, 
    NodeTypes.DECLARATION, 
    NodeTypes.RULE, 
    NodeTypes.IMPORT, 
    NodeTypes.INCLUDE, 
    NodeTypes.EXTEND, 
    NodeTypes.MIXIN, 
    NodeTypes.ERROR, 
    NodeTypes.EACHSTATEMENT, 
    NodeTypes.IFSTATEMENT
]

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

    [NodeTypes.DECLARATION]: {
        type: NodeTypes.DECLARATION,
        left: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.VAR_KEY], NodeTypes.DECLARATION),
        right: constructDynamicStruct([NodeTypes.LIST], NodeTypes.DECLARATION)
    },

    [NodeTypes.RULE]: {
        type: NodeTypes.RULE,
        // selector: str | placeholder | list,
        selector: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.PLACEHOLDER, NodeTypes.LIST], NodeTypes.RULE),
        children: [constructDynamicStruct(Statement_Types, NodeTypes.RULE)]
    },

    [NodeTypes.IMPORT]: {
        type: NodeTypes.IMPORT,
        params: [constructDynamicStruct([NodeTypes.TEXT], NodeTypes.IMPORT)]
    },

    [NodeTypes.INCLUDE]: {
        type: NodeTypes.INCLUDE,
        id: {
            type: NodeTypes.IDENTIFIER,
            name: "string"
        },
        args: [constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.BINARY, NodeTypes.DECLARATION], NodeTypes.INCLUDE)]
    },

    [NodeTypes.EXTEND]: {
        type: NodeTypes.EXTEND,
        param: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.PLACEHOLDER], NodeTypes.EXTEND),
    },

    [NodeTypes.MIXIN]: {
        type: NodeTypes.MIXIN,
        id: {
            type: NodeTypes.IDENTIFIER,
            name: 'string'
        },
        // params: [var | assign],
        params: [constructDynamicStruct([NodeTypes.VARIABLE, NodeTypes.DECLARATION], NodeTypes.MIXIN)],
        body: constructDynamicStruct([NodeTypes.BODY], NodeTypes.MIXIN)
    },

    [NodeTypes.ERROR] : {
        type: NodeTypes.ERROR,
        value: constructDynamicStruct([NodeTypes.LIST], NodeTypes.ERROR)
    },

    [NodeTypes.IFSTATEMENT]: {
        type: NodeTypes.IFSTATEMENT,
        test: constructDynamicStruct([NodeTypes.TEXT, NodeTypes.VARIABLE, NodeTypes.BINARY], NodeTypes.IFSTATEMENT),
        consequent: constructDynamicStruct([NodeTypes.BODY], NodeTypes.IFSTATEMENT),
        //alternate: IfStatement | body | null
        alternate: constructDynamicStruct([NodeTypes.IFSTATEMENT, NodeTypes.BODY, 'null'], NodeTypes.IFSTATEMENT)
    },

    [NodeTypes.EACHSTATEMENT]: {
        type: NodeTypes.EACHSTATEMENT,
        left: constructDynamicStruct([NodeTypes.VARIABLE], NodeTypes.EACHSTATEMENT),
        right: constructDynamicStruct([NodeTypes.VARIABLE], NodeTypes.EACHSTATEMENT),
        body: constructDynamicStruct([NodeTypes.RULE], NodeTypes.EACHSTATEMENT)
    },
    [NodeTypes.PROGRAM]: {
        type: NodeTypes.PROGRAM,
        fileSourceMap: {},
        children: [constructDynamicStruct(Statement_Types, NodeTypes.PROGRAM)]
    }

};


const Type_Struct_Map = Object.keys(Type_Schema_Map).reduce((resultMap, type) => {
    resultMap[type] = customStruct(Object.assign(Type_Schema_Map[type], baseSchema))
    return resultMap;
}, {})

export default function error_checking(ast) {
    try {
        Type_Struct_Map[NodeTypes.PROGRAM](ast);
    } catch (e) {
        throw e
    }

    return ast;
}