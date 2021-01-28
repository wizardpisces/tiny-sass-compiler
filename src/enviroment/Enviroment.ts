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
     * etc: 
     * @use './vars.scss'
     * body{
     *     color: vars.$color-primary
     * }
     */
    envMap: {
        [namespace: string]: Environment
    } = {}

    parent: Environment | null

    lookUpModuleChain: Environment[] = []

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

        /**
         * added first in first
         */
        this.lookUpModuleChain = [this]
    }

    /**
      * lookup steps:
      * 1. search this module
      * 2. search up this -> parent module
      * 3. search through @forward modules (loopUpChain)
      * 4. repeat step 1
      */

    lookup(name: string, kind: Kind): Environment | undefined {

        let envList: Environment[] = [this,...this.lookUpModuleChain];

        function searchScope(scope: Environment | null) {
            while (scope) {
                if (scope.vars[kind] && scope.vars[kind][name])
                    return scope;
                scope = scope.parent;
            }
            return undefined
        }

        return envList.find((moduleEnv: Environment) => {
            return searchScope(moduleEnv) !== undefined
        })
    }

    public addLookUpModuleChain(env: Environment) {
        /**
         * later added module will be higher lookup (refer to lookup method) priority
         */
        this.lookUpModuleChain.unshift(env)
    }

    public extend() {
        return new Environment(this);
    }
    /**
     * support for length one namespace for now
     */
    public setEnvByName(name: string, env: Environment) {
        this.envMap[name] = env
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
            if (!env) {
                throw new Error(`[Environment]: Undefined Environment name:${name.name},namespace:${JSON.stringify(name.namespace)}`);
            }
            name = name.name
        }

        result = env.lookup(name, kind);
        if (result) {
            return result.vars[kind][name].value
        }

        return undefined;
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