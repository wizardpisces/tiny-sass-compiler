
import {
    NodeTypes
} from '../parse/ast';

import {
    fillWhitespace
} from '../parse/util'

/**
 * use Enviroment to maintain a scope to interprete variable scope
 * 
 * extend() — to create a subscope.
 * lookup(name) — to find the scope where the variable with the given name is defined.
 * get(name) — to get the current value of a variable. Throws an error if the variable is not defined.
 * set(name, value) — to set the value of a variable. This needs to lookup the actual scope where the variable is defined. If it's not found and we're not in the global scope, throws an error.
 * def(name, value) — this creates (or shadows, or overwrites) a variable in the current scope. 
 * 
 * */

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
}
Environment.prototype = {
    extend: function () {
        return new Environment(this);
    },
    // lookup: function (name) {
    //     let scope = this;
    //     while (scope) {
    //         if (Object.prototype.hasOwnProperty.call(scope.vars, name))
    //             return scope;
    //         scope = scope.parent;
    //     }
    // },
    get: function (name) {
        if (name in this.vars)
            return this.vars[name];
        throw new Error("Undefined variable " + name);
    },
    // set: function (name, value) {
    //     let scope = this.lookup(name);
    //     // let's not allow defining globals from a nested environment
    //     if (!scope && this.parent)
    //         throw new Error("Undefined variable " + name);
    //     return (scope || this).vars[name] = value;
    // },
    def: function (name, value) {
        return this.vars[name] = value;
    }
};
/**
 * todos: optimize deep_clone
 */
function deep_clone(obj){
    return JSON.parse(JSON.stringify(obj))
}

/**
 * 
 * @param {refer to parse result,eg: ast-example} ast 
 * ast => ast
 * transform variable to real value based on scope
 */

export default function transform_variable(ast) {
    let env = new Environment();

    function evaluate(exp, env) {
        switch (exp.type) {
            /**
             * Expression
             */
            case NodeTypes.TEXT: return transform_str(exp);
            case NodeTypes.PUNC: return transform_punc(exp);
            case NodeTypes.OPERATOR: return transform_op(exp);
            case NodeTypes.VARIABLE: return transform_var(exp, env);
            case NodeTypes.VAR_KEY: return transform_var_key(exp, env);
            case NodeTypes.LIST: return transform_list(exp, env);

            /**
             * Statement
             */
            case NodeTypes.ASSIGN: return transform_assign(exp, env);
            case NodeTypes.BINARY: return transform_binary(exp, env);
            case NodeTypes.MIXIN: return transform_mixin(exp, env);
            case NodeTypes.INCLUDE: return transform_include(exp, env);
            case NodeTypes.CHILD:
            case NodeTypes.BODY:
                return transform_child_or_body(exp, env);

            case NodeTypes.EXTEND: return exp;
            case NodeTypes.IFSTATEMENT: return transform_if(exp, env);
            case NodeTypes.EACHSTATEMENT: return transform_each(exp, env);

            case NodeTypes.ERROR: 
                throw new Error(transform_list(exp.value, env).value) 

            default:
                throw new Error("Don't know how to compile expression for " + JSON.stringify(exp));
        }
    }

    function transform_list(exp, env){
        return {
            type: NodeTypes.TEXT,
            value: fillWhitespace(exp.value).map(item => {
               return evaluate(item, env).value
            }).join('').trim()
        }
    }
    /**
     * any expressions separated with spaces or commas count as a list
     */
    function transform_each(exp, env){
        let restoredContext = deep_clone(exp);
        let right = evaluate(restoredContext.right, env),
            scope = env.extend(),
            list = [];

        if(right.type === NodeTypes.TEXT){
            list = right.value.split(/,|\s+/).filter(val=>val!=='')
        }

        let children = list.map(val => {
            /**
             * restore context with iterate multiple times
             */

            restoredContext = deep_clone(exp);
            
            scope.def(restoredContext.left.value, val);

            return evaluate(restoredContext.body, scope)
        })

        /**
         * return a created an NodeTypes.EMPTY child whose children will be flattened in transform_nest
         */

        return evaluate({
            type: NodeTypes.CHILD,
            selector:{
                type:NodeTypes.TEXT,
                value:''
            },
            children,
        },env) ;

    }
/**
 * context will be restored with function 
 */
    function transform_if(exp, env){

        function is_true_exp(expression, env){

            let resultExp = expression;
            /**
             *  1. if $bool { }
             *  2. if true { }
            */

            if (resultExp.type === NodeTypes.VARIABLE || resultExp.type === NodeTypes.BINARY){
                resultExp = evaluate(expression, env);
            }

            if (resultExp.value === "0" || resultExp.value==="false"){
                return false;
            }

            return true
        }

        if (is_true_exp(exp.test, env)){
            return evaluate(exp.consequent, env);
        }else if(exp.alternate){
            return evaluate(exp.alternate, env)
        }else{
            return null;
        }
    }

/**
 * Solve situation, assign value with NodeTypes.PUNC, eg:
 * $font: Helvetica, sans-serif;
 */
    function transform_punc(exp) {
        exp.type = NodeTypes.TEXT
        return exp;
    }

/**
 * Solve situation, selector with operators, eg:
 * .a > b{}
 */
    function transform_op(exp){
        return transform_punc(exp);
    }

/**
 * transform @mixin -> set to env -> delete @mixin ast
 */
    function transform_mixin(exp,env){

        function make_function(){
            
            /**
             * deep clone function statement to restore context when called multiple times
             */

            let restoredContext = deep_clone(exp),
                params = restoredContext.params,
                scope = env.extend();

            function handle_params_default_value(params){
                return params.map((param) => {
                    let ret = param;
                    if (param.type === NodeTypes.ASSIGN) {
                        ret = {
                            type: NodeTypes.VARIABLE,
                            value: param.left.value
                        }
                        evaluate(param, scope)
                    }
                    return ret;
                })
            }

            params = handle_params_default_value(params);

            params.forEach((param, i) => {
                if (param.type === NodeTypes.VARIABLE && arguments[i]) {
                    scope.def(param.value, arguments[i])
                }
            })

            return evaluate(restoredContext.body, scope);
        }

        env.def(exp.id.name,make_function)

        return null;
    }

    function transform_include(exp,env){
        let func = env.get(exp.id.name);
        return func.apply(null,exp.args.map(arg => {

            /**
             * @include avatar(100px, $circle: false);
             */
            if (arg.type === NodeTypes.ASSIGN) {
                return evaluate(arg.right, env).value
            }

            return evaluate(arg, env).value
        }))
    }

    /**
     * Todos:add more unit type eg: pt px etc
     * 
     */
    function transform_binary(exp, env){
        
        let hasPercent = false,
            unitExtracted = false,
            unit = "";

        function parseFloatFn(str){

            if (isNaN(parseFloat(str))){
                return str;
            }
            
            if(str === "100%"){
                hasPercent = true;
                return 1;
            }
            
            /**
             * make the first encountered unit as the final unit
              */
            if (!unitExtracted){
                unitExtracted = true;
                let matched = str.match(/\d+([a-z]*)/);
                unit = matched && matched.length > 0 ? matched[1] : ''
            }
            
            return parseFloat(str)
        }

        function transformVal(str){
            function transformPercent(str){
                return parseFloat(str) * 100 + "%";
            }
            function addUnit(str){
                return str+unit;
            }
            return hasPercent ? transformPercent(str) : addUnit(str)
        }

        function evaluate_binary(ast){

            const opAcMap = {
                // '=': (left, right) => left = right,
                '||': (left, right) => left || right,
                '&&': (left, right) => left && right,

                '==':(left, right) => left == right,
                '!=':(left, right) => left != right,
                '>=':(left, right) => left >= right,
                '<=':(left, right) => left <= right,
                '<=':(left, right) => left <= right,

                '+': (left, right) => left + right,
                '-': (left, right) => left - right,
                '/': (left, right) => left / right,
                '*': (left, right) => left * right,
                '%': (left, right) => left % right,

            };

            if (ast.type === NodeTypes.TEXT) return parseFloatFn(ast.value);
            if (ast.type === NodeTypes.VARIABLE) return evaluate_binary(evaluate(ast, env))
            if (ast.type === NodeTypes.BINARY) return opAcMap[ast.operator](evaluate_binary(ast.left),evaluate_binary(ast.right));

            throw new Error("Don't know how to evaluate_binary type: " + ast.type);
        };

        let value = evaluate_binary(exp);

        return {
            type: NodeTypes.TEXT,
            value: transformVal(value)
        }
    }

    function transform_str(exp) {
        return exp;
    }

    function transform_var(exp, env) {
        exp.type = NodeTypes.TEXT;
        exp.value = env.get(exp.value);
        return exp;
    }

    function transform_var_key(exp, env) {
        return transform_var(exp, env);
    }

    function transform_assign(exp, env) {
        /**
         * set real value to env and delete variable assign exp
         * or
         * replace variable with real value
          */


        if(exp.left.type === NodeTypes.VARIABLE){
            env.def(exp.left.value, evaluate(exp.right, env).value)
            return null;
        }

        if (exp.left.type === NodeTypes.VAR_KEY){
            exp.left = evaluate(exp.left, env);
        }

        exp.right = evaluate(exp.right, env);

        return exp;
    }

    function transform_child_or_body(exp, env) {

        function flatten_included_body(children){
            let arr = []
            children.forEach(child=>{
                if(child.type === NodeTypes.BODY){
                    arr = arr.concat(flatten_included_body(child.children))
                }else{
                    arr.push(child)
                }
            })
            return arr;
        }

        let scope = env.extend();

        exp.children = exp.children.map(child => evaluate(child, scope)).filter(exp => exp !== null);
        if(exp.selector && exp.selector.type === NodeTypes.LIST){
            exp.selector = evaluate(exp.selector,scope)
        }
        /**
         * resolve BlockStatement/body
         * 
         * @include include_function_body
         * @if which contain BlockStatement
          */
        exp.children = flatten_included_body(exp.children);

        return exp;
    }

    function toplevel(ast, env) {
        // console.log(JSON.stringify(ast))
        ast.prog = ast.prog.map(exp => evaluate(exp, env)).filter(exp => exp !== null)
        // console.log(JSON.stringify(ast))

        return ast;
    }

    return toplevel(ast, env);
}