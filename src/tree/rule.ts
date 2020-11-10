import { RuleStatement, MediaStatement, createRuleFromMedia, createRuleStatement, SelectorNode } from "../parse/ast";
import { isMediaNode } from '../parse/util';

type params = Parameters<typeof createRuleStatement>

export default class Rule {
    ruleStatement: RuleStatement
    constructor(selector: params[0] | MediaStatement | RuleStatement,children?: params[1]){
        if (isMediaNode(selector)){
            this.ruleStatement = createRuleFromMedia(selector as MediaStatement)
        } else if(children){
            this.ruleStatement = createRuleStatement(selector as params[0], children)
        }else{
            this.ruleStatement = selector as RuleStatement
        }
    }

    addMeta(meta: SelectorNode['meta']){
        this.ruleStatement.selector.meta = joinMeta(this.ruleStatement.selector.meta,meta)
        return this;
    }

    toJSON(){
        return this.ruleStatement
    }
}

function joinMeta(meta1: SelectorNode['meta'], meta2: SelectorNode['meta']) {
    return meta1.concat(meta2)
}