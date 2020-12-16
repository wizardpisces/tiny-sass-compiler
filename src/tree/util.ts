import { RuleStatement } from '@/parse/ast';
import { CodegenContext } from '@/type';
import { Rule } from '.';

export function genChildrenIterator(children: RuleStatement[], context: CodegenContext) {
    const { push, deindent, indent, newline } = context;
    push('{');
    indent();

    children.forEach((child: RuleStatement, index: number) => {
        new Rule(child).genCSS(context)
        if (index !== children.length - 1) {
            newline()
        }
    })
    deindent();
    push('}');
}