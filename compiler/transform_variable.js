
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
    lookup: function (name) {
        let scope = this;
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name))
                return scope;
            scope = scope.parent;
        }
    },
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
 * @param {refer to parser result,eg: ast-example} ast 
 * ast => ast
 * transform variable to real value based on scope
 */

module.exports = function transform_variable(ast) {
    let env = new Environment();

    function evaluate(exp, env) {
        switch (exp.type) {
            /**
             * Expression
             */
            case "str": return transform_str(exp);
            case "punc": return transform_punc(exp);
            case "op": return transform_op(exp);
            case "var": return transform_var(exp, env);
            case "var_key": return transform_var_key(exp, env);
            case "list": return transform_list(exp, env);

            /**
             * Statement
             */
            case "assign": return transform_assign(exp, env);
            case "binary": return transform_binary(exp, env);
            case "@mixin": return transform_mixin(exp, env);
            case "@include": return transform_include(exp, env);
            case "child":
            case "body":
                return transform_child(exp, env);

            case "@extend": return exp;
            case "IfStatement": return transform_if(exp, env);

            case "@error": 
                throw new Error(transform_list(exp.value, env).value) 

            default:
                throw new Error("Don't know how to compile expression for " + JSON.stringify(exp));
        }
    }

    function transform_list(exp, env){
        return {
            type: "str",
            value: exp.value.map(item => {
               return evaluate(item, env).value
            }).join(' ').trim()
        }
    }

    function transform_if(exp, env){
        function is_true_exp(expression, env){

            let resultExp = expression;
            /**
             *  1. if $bool { }
             *  2. if true { }
            */

            if (resultExp.type === 'var' || resultExp.type === 'binary'){
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
 * Solve situation, assign value with punc, eg:
 * $font: Helvetica, sans-serif;
 */
    function transform_punc(exp) {
        exp.type = 'str'
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

            let expClone = deep_clone(exp),
                params = expClone.params,
                scope = env.extend();

            function handle_params_default_value(params){
                return params.map((param) => {
                    let ret = param;
                    if (param.type === 'assign') {
                        ret = {
                            type: 'var',
                            value: param.left.value
                        }
                        evaluate(param, scope)
                    }
                    return ret;
                })
            }

            params = handle_params_default_value(params);

            params.forEach((param, i) => {
                if (param.type === 'var' && arguments[i]) {
                    scope.def(param.value, arguments[i])
                }
            })

            return evaluate(expClone.body, scope);
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
            if (arg.type === 'assign') {
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
                '+': (left, right) => left + right,
                '-': (left, right) => left - right,
                '/': (left, right) => left / right,
                '*': (left, right) => left * right,
                '%': (left, right) => left % right,
                '==':(left, right) => left == right
            };

            if (ast.type === "str") return parseFloatFn(ast.value);
            if (ast.type === "var") return evaluate_binary(evaluate(ast, env))
            if (ast.type === "binary") return opAcMap[ast.operator](evaluate_binary(ast.left),evaluate_binary(ast.right));

            throw new Error("Don't know how to evaluate_binary type: " + ast.type);
        };

        let value = evaluate_binary(exp);

        return {
            type: "str",
            value: transformVal(value)
        }
    }

    function transform_str(exp) {
        return exp;
    }

    function transform_var(exp, env) {
        exp.type = "str";
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


        if(exp.left.type === "var"){
            env.def(exp.left.value, evaluate(exp.right, env).value)
            return null;
        }

        if (exp.left.type === "var_key"){
            exp.left = evaluate(exp.left, env);
        }

        exp.right = evaluate(exp.right, env);

        return exp;
    }

    function transform_child(exp, env) {

        function flatten_included_body(children){
            let arr = []
            children.forEach(child=>{
                if(child.type === 'body'){
                    arr = arr.concat(flatten_included_body(child.children))
                }else{
                    arr.push(child)
                }
            })
            return arr;
        }

        env = env.extend();

        exp.children = exp.children.map(child => evaluate(child, env)).filter(exp => exp !== null);
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
        ast.prog = ast.prog.map(exp => evaluate(exp, env)).filter(exp => exp !== null)
        return ast;
    }

    return toplevel(ast, env);
}