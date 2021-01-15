/**
 * use Kind to differentiate same name but different kind variable
 * @function vs @mixin
 * */

import { NodeTypes } from '../parse/ast';

export type NamespacedId = {
    name: string
    namespace: string | string[] | undefined
}

export type Kind = NodeTypes.VARIABLE | NodeTypes.VAR_KEY // VAR_KEY only involes get data so merge into NodeTypes.VARIABLE for now
    | NodeTypes.FUNCTION | NodeTypes.RETURN
    | NodeTypes.MIXIN | NodeTypes.CONTENT

export class Variable {
    private _value: string | number | Function | Environment
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
    /**
     * to resolve @use namespaced variable ,@include ,callExpression etc
     */
    envMap: {
        [namespace: string]: Environment
    } = {}

    parent: Environment | null

    constructor(parent: Environment | null) {
        /**
         * this line could also be written in : this.vars = {}
         * history : 
         * used for convinient scoped vars query, 
         * which is migrated to parent search then get data by two vars
         */
        this.vars = Object.create(parent ? parent.vars : null);
        /**
         * link child envMap to the same top envMap to reduce @use module namespaced env query time
         */
        this.envMap = parent && parent.envMap || {}
        /**
         * link parent for convinient scope search
         */
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

    /**
     * support for length one namespace for now
     */
    public setEnvByNamespace(namespace: string, env: Environment) {
        this.envMap[namespace] = env
    }

    public getEnvByNamespace(namespace: NamespacedId['namespace']): Environment {
        let env: Environment = this;

        if (Array.isArray(namespace) && namespace.length > 0) {
            let len = namespace.length,
                i = 0;

            while (len--) {
                env = env.envMap[namespace[i++]]
            }

        } else if (typeof namespace === 'string') {
            env = env.envMap[namespace]
        }

        return env
    }

    public get(name: string | NamespacedId, kind: Kind = NodeTypes.VARIABLE) {
        let result: any,
            env: Environment = this;

        if (typeof name === 'object') {
            env = env.getEnvByNamespace(name.namespace)
            if(!env){
                throw new Error(`[Environment]: Undefined Environment name:${name.name},namespace:${JSON.stringify(name.namespace)}`);
            }
            name = name.name
        }

        result = env.lookup(name, kind);
        if (result) {
            return result.vars[kind][name].value
        }

        return null;
    }

    public def(name: string, value: any = '', kind: Kind = NodeTypes.VARIABLE) {

        if (kind === NodeTypes.VARIABLE && typeof value === 'function') { // outside register function plugin
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