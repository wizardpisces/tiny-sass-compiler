
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
        var scope = this;
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
    set: function (name, value) {
        var scope = this.lookup(name);
        // let's not allow defining globals from a nested environment
        if (!scope && this.parent)
            throw new Error("Undefined variable " + name);
        return (scope || this).vars[name] = value;
    },
    def: function (name, value) {
        return this.vars[name] = value;
    }
};

/**
 * 
 * @param {refer to parser result,eg: ast-example} ast 
 * ast => ast
 * transform variable to real value based on scope
 */

module.exports = function transform_var(ast) {
    let env = new Environment();

    function evaluate(exp, env) {
        switch (exp.type) {
            case "str": return transform_str(exp);
            case "var": return transform_var(exp, env);
            case "list": return transform_list(exp, env);
            case "assign": return transform_assign(exp, env);
            case "child": return transform_child(exp, env);
            case "@extend": return exp;

            default:
                throw new Error("Don't know how to compile expression for " + JSON.stringify(exp));
        }
    }

    function transform_list(exp, env){
        return {
            type: "str",
            value: exp.value.map(item => {
                // console.log('evaluate(item, env)', item,evaluate(item, env))
               return evaluate(item, env).value
            }).join(' ').trim()
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

    function transform_assign(exp, env) {
        /**
         * set real value to env and delete variable assign exp
         * or
         * replace variable with real value
          */

        if(exp.left.type === "var"){
            env.set(exp.left.value, evaluate(exp.right, env).value)
            return null;
        }

        exp.right = evaluate(exp.right, env);

        return exp;
    }

    function transform_child(exp, env) {
        env = env.extend();
        exp.children = exp.children.map(child => evaluate(child, env)).filter(exp => exp !== null);
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