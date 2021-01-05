/**
 * use Kind to differentiate same name but different kind variable
 * @function vs @mixin
 * */

import { NodeTypes } from '../parse/ast';

export type Kind = NodeTypes.VARIABLE | NodeTypes.VAR_KEY // VAR_KEY only involes get data so merge into NodeTypes.VARIABLE for now
    | NodeTypes.FUNCTION | NodeTypes.RETURN
    | NodeTypes.MIXIN | NodeTypes.CONTENT

export class Variable {
    private _value: any
    kind: Kind = NodeTypes.VARIABLE // set default as VARIABLE
    constructor(kind: Kind, val: any) {
        this.kind = kind;
        this._value = val;
    }
    get value() {
        return this._value;
    }
    set value(val: any) {
        this._value = val;
    }
}

export class Environment {
    vars: {
        [kind: string]: {
            [name: string]: Variable
        }
    }

    parent: Environment | null

    constructor(parent: Environment | null) {
        this.vars = Object.create(parent ? parent.vars : null);
        this.parent = parent;
    }

    public extend() {
        return new Environment(this);
    }

    lookup(name: string, kind: Kind) {
        let scope: Environment | null = this;
        while (scope) {
            if (scope.vars[kind] && scope.vars[kind][name])
                return scope;
            scope = scope.parent;
        }
    }

    public get(name: string, kind: Kind = NodeTypes.VARIABLE) {
        let result = this.lookup(name, kind);

        if (result) {
            return result.vars[kind][name].value
        }

        return null;
        // throw new Error(`[Enviroment]: Undefined variable name:${name},kind:${kind}.`);
    }
    // set: function (name, value) {
    //     let scope = this.lookup(name);
    //     // let's not allow defining globals from a nested environment
    //     if (!scope && this.parent)
    //         throw new Error("Undefined variable " + name);
    //     return (scope || this).vars[name] = value;
    // },
    public def(name: string, value: any = '', kind: Kind = NodeTypes.VARIABLE) {
        
        if (kind === NodeTypes.VARIABLE && typeof value === 'function'){ // outside register function plugin
            kind = NodeTypes.FUNCTION
        }

        if (!this.vars[kind]) {
            this.vars[kind] = {}
        }
        return this.vars[kind][name] = new Variable(kind, value);
    }

    public add(...args: Parameters<Environment['def']>) {
        this.def.apply(this, args)
    }
};