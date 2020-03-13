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
    },
    updateSelector: function (selector) {
        return this.selector = this.selector + ' ' + selector
    }
};
/**
 * 
 * @param {refer to parser result,eg: ast-example} ast 
 * ast => ast
 * transform variable to real value based on scope
 */

function transform_ast(ast) {
    let env = new Environment();

    function is_var(exp) {
        return exp.type === 'var'
    }

    function evaluate(exp, env) {
        switch (exp.type) {
            case "str": return transform_str(exp);
            case "var": return transform_var(exp, env);
            case "assign": return transform_assign(exp, env);
            case "child": return transform_child(exp, env);

            default:
                throw new Error("Don't know how to compile expression for " + JSON.stringify(exp));
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
         * 
         * or

         * replace variable with real value
          */

        if (is_var(exp.left)) {
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
        ast.prog = ast.prog.map(exp => evaluate(exp, env)).filter(exp => exp !== null)
        return ast;
    }

    return toplevel(ast, env);
}
/**
 *
 * ast => ast
 * transform nested sass ast to flattened css ast
 * 
 */

function flatten_ast(ast) {
    let env = new Environment();

    function flatten_child(child, arr=[]) {

        function flatten(child,parentSelector=''){
            child.selector.value = parentSelector + ' ' + child.selector.value
            arr.push(child);
            child.children.forEach((exp, index) => {
                if (exp.type === 'child') {
                    child.children.splice(index, 1)
                    flatten(exp, child.selector.value)
                }
            });
            return arr;
        }

        return flatten(child)
    }

    function toplevel(ast) {
        let prog = [];
        
        ast.prog.forEach(exp => {
            if (exp.type === 'child') {
                prog = prog.concat(...flatten_child(exp))
            }else{
                prog.push(exp)
            }
        });

        ast.prog = prog;

        return ast;
    }

    return toplevel(ast, env)
}

/**
 * 
 * ast => css
 * 
 */

function make_css(ast) {

    function compile(exp) {
        switch (exp.type) {
            case "str": return css_str(exp);
            case "var": return css_var(exp);
            case "assign": return css_assign(exp);
            case "child": return css_child(exp);

            default:
                throw new Error("Don't know how to compile expression for " + JSON.stringify(exp));
        }
    }

    function css_str(exp) {
        return exp.value;
    }

    function css_var(exp) {
        return exp.value;
    }

    function css_assign(exp) {
        return compile(exp.left) + ':' + compile(exp.right) + ';';
    }

    function css_child(exp) {
        return exp.selector.value + '{' + exp.children.map(child => compile(child)).join('') + '}';
    }

    function toplevel(ast) {
        return ast.prog.map(exp => compile(exp)).join('');
    }

    return toplevel(ast);
}

module.exports = compiler = (ast) => make_css(flatten_ast((transform_ast(ast))));