import { RuleStatement, MediaStatement, createRuleFromMedia, createRuleStatement, SelectorNode, DeclarationStatement } from "../parse/ast";
import { isMediaNode, isEmptyNode } from '../parse/util';
import { CodegenContext } from '@/type';
import Selector from './selector';
import { Declaration } from '.';
import { Tree } from './tree';

type params = Parameters<typeof createRuleStatement>

export default class Rule extends Tree{
    ruleStatement: RuleStatement
    constructor(selector: params[0] | MediaStatement | RuleStatement,children?: params[1]){
        super()
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

    genCSS(context:CodegenContext){
        let node =  this.ruleStatement;
        const { push, deindent, indent, newline } = context;

        new Selector(node.selector).genCSS(context)

        push('{');
        indent();
        node.children.forEach((declaration: any, index: number) => {
            if (index && !isEmptyNode(declaration)) {
                newline()
            }
            
            new Declaration(declaration as DeclarationStatement).genCSS(context)
        })

        deindent();
        push('}');
    }
}

function joinMeta(meta1: SelectorNode['meta'], meta2: SelectorNode['meta']) {
    return meta1.concat(meta2)
}