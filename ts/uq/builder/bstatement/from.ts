import { FromStatement, EnumSysTable, ValueExpression, CompareExpression, JoinType, FromStatementInPend } from "../../il";
import { KeyOfMapFieldTable, MapFieldTable } from "../Biz";
import {
    Exp, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIn, ExpIsNull
    , ExpLT, ExpNum, ExpStr, ExpVal, ExpVar, StatementBase
} from "../sql";
import { EntityTable, VarTableWithSchema } from "../sql/statementWithFrom";
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

        const { asc } = this.istatement;

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
        const fromMain = this.buildFromMain(cmpStart);
        sqls.push(fromMain);
    }

    protected buildFromMain(cmpStart: ExpCmp): StatementBase {
        const { ban, cols } = this.istatement;
        let select = this.buildSelect(cmpStart);
        select.column(new ExpField('id', t1), 'id');
        if (ban === undefined) {
            select.column(ExpNum.num0, 'ban');
        }
        else {
            select.column(this.context.expCmp(ban.val) as ExpVal, 'ban');
        }
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { name, val, field } = col;
            let bField = field.db(this.context);
            let colArr: Exp[] = bField.buildColArr();
            /*
            let { bud, entity } = field;
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
            */
            colArr.push(this.context.expVal(val as ValueExpression));
            arr.push(new ExpFunc('JSON_ARRAY', ...colArr));
        }
        select.column(new ExpFunc('JSON_ARRAY', ...arr), 'json');
        return select;
    }

    protected buildSelect(cmpStart: ExpCmp) {
        const { factory } = this.context;
        const { asc, where, bizEntityTable, bizEntityArr, ofIXs, ofOn } = this.istatement;
        const bizEntity0 = bizEntityArr[0];
        const select = factory.createSelect();

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
        return select;
    }
}

export class BFromStatementInPend extends BFromStatement<FromStatementInPend> {
    protected override buildFromMain(cmpStart: ExpCmp) {
        const { factory } = this.context;
        let select = super.buildSelect(cmpStart);
        let tblA: KeyOfMapFieldTable = 'pend';
        let tblB: KeyOfMapFieldTable = 'bin';
        let tblSheet: KeyOfMapFieldTable = 'sheet';
        let tblSheetBin: KeyOfMapFieldTable = 'sheetBin';
        const a = MapFieldTable[tblA], b = MapFieldTable[tblB], c = 'c', d = 'd';
        const sheet = MapFieldTable[tblSheet];
        const sheetBin = MapFieldTable[tblSheetBin];
        select.column(new ExpField('id', a), 'pend');
        select.column(new ExpField('base', d), 'sheet');
        select.column(new ExpField('bin', a), 'id');
        select.column(new ExpField('i', b), 'i');
        select.column(new ExpField('x', b), 'x');
        select.column(new ExpField('value', b), 'value');
        select.column(new ExpField('price', b), 'price');
        select.column(new ExpField('amount', b), 'amount');
        select.column(new ExpField('mid', a), 'mid');
        select.column(new ExpField('value', a), 'pendvalue');
        select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('bin', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizPhrase, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('base', a)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bud, false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('id', b)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizBin, false, sheetBin))
            .on(new ExpEQ(new ExpField('id', sheetBin), new ExpField('base', d)))
            .join(JoinType.left, new EntityTable(EnumSysTable.sheet, false, sheet))
            .on(new ExpEQ(new ExpField('id', sheet), new ExpField('id', sheetBin)));

        let insert = factory.createInsert();
        insert.table = new VarTableWithSchema('$page');
        insert.cols = [
            { col: 'pend', val: undefined },
            { col: 'sheet', val: undefined },
            { col: 'id', val: undefined },
            { col: 'i', val: undefined },
            { col: 'x', val: undefined },
            { col: 'value', val: undefined },
            { col: 'price', val: undefined },
            { col: 'amount', val: undefined },
            { col: 'mid', val: undefined },
            { col: 'pendvalue', val: undefined },
        ];
        insert.select = select;
        return insert;
    }
}
