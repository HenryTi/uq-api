import { BizPhraseType, FromStatement, EnumSysTable, ValueExpression, CompareExpression } from "../../il";
import { Exp, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIn, ExpIsNull, ExpLT, ExpNum, ExpStr, ExpVal, ExpVar } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

const t1 = 't1';
const pageStart = '$pageStart';

export class BFromStatement extends BStatement<FromStatement> {
    body(sqls: Sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';

        const { asc, cols, ban, where, bizEntityTable, bizEntityArr, bizEntity0 } = this.istatement;

        const ifStateNull = factory.createIf();
        sqls.push(ifStateNull);
        ifStateNull.cmp = new ExpIsNull(new ExpVar(pageStart));
        const setPageState = factory.createSet();
        ifStateNull.then(setPageState);
        let expStart: ExpVal, cmpStart: ExpCmp;
        let varStart = new ExpVar(pageStart);
        if (asc === 'asc') {
            expStart = new ExpNum(0);
            cmpStart = new ExpGT(new ExpField('id', t1), varStart);
        }
        else {
            expStart = new ExpStr('9223372036854775807');
            cmpStart = new ExpLT(new ExpField('id', t1), varStart);
        }
        setPageState.equ(pageStart, expStart);

        const select = factory.createSelect();
        sqls.push(select);
        select.column(new ExpField('id', t1), 'id');
        if (ban === undefined) {
            select.column(ExpNum.num0, 'ban');
        }
        else {
            select.column(this.context.expCmp(ban.val) as ExpVal, 'ban');
        }
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { name, val, bud, entity } = col;
            const colArr: Exp[] = [];
            if (bud !== undefined) {
                if (entity !== undefined) {
                    colArr.push(new ExpNum(entity.id));
                }
                colArr.push(new ExpNum(bud.id));
            }
            else {
                colArr.push(new ExpStr(name));
            }
            colArr.push(this.context.expVal(val as ValueExpression));
            arr.push(new ExpFunc('JSON_ARRAY', ...colArr));
        }

        select.from(new EntityTable(bizEntityTable, false, t1));
        select.column(new ExpFunc('JSON_ARRAY', ...arr), 'json');
        let fieldBase = new ExpField('base', t1);
        let expBase = bizEntityArr.length === 1 ?
            new ExpEQ(fieldBase, new ExpNum(bizEntity0.id))
            :
            new ExpIn(
                fieldBase,
                ...bizEntityArr.map(v => new ExpNum(v.id))
            );
        let wheres: ExpCmp[] = [
            cmpStart,
            expBase,
            this.context.expCmp(where),
        ];
        select.where(new ExpAnd(...wheres));
        select.order(new ExpField('id', t1), asc);
        select.limit(new ExpVar('$pageSize'));
    }
}
