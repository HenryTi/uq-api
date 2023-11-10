import { FromStatement, EnumSysTable, ValueExpression, CompareExpression, JoinType, FromStatementInPend } from "../../il";
import { Exp, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIn, ExpIsNull, ExpLT, ExpNum, ExpStr, ExpVal, ExpVar } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

const t1 = 't1';
const pageStart = '$pageStart';

export class BFromStatement<T extends FromStatement> extends BStatement<T> {
    body(sqls: Sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';

        const { asc, cols, ban, where, bizEntityTable, bizEntityArr, ofIXs, ofOn } = this.istatement;
        const bizEntity0 = bizEntityArr[0];

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

        let expPrev = new ExpField('id', t1);
        if (ofIXs !== undefined) {
            let len = ofIXs.length;
            for (let i = 0; i < len; i++) {
                let ix = ofIXs[i];
                let tOf = 'of' + i;
                let tBud = 'bud' + i;
                select.join(JoinType.join, new EntityTable(EnumSysTable.ixBud, false, tOf))
                    .on(new ExpEQ(new ExpField('x', tOf), expPrev))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, tBud))
                    .on(new ExpAnd(
                        new ExpEQ(new ExpField('id', tBud), new ExpField('i', tOf)),
                        new ExpEQ(new ExpField('base', tBud), new ExpNum(ix.id)),
                    ));
                expPrev = new ExpField('ext', tBud);
            }
        }

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
        if (ofOn !== undefined) {
            wheres.push(new ExpEQ(expPrev, this.context.expVal(ofOn)));
        }
        select.where(new ExpAnd(...wheres));
        select.order(new ExpField('id', t1), asc);
        select.limit(new ExpVar('$pageSize'));
    }
}

export class BFromStatementInPend extends BFromStatement<FromStatementInPend> {
}
