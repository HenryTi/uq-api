import { binAmount, binPrice, binValue } from "../../../consts";
import { FromStatement, EnumSysTable, ValueExpression, JoinType, FromStatementInPend, FromEntity } from "../../../il";
import { KeyOfMapFieldTable, MapFieldTable } from "..";
import {
    Exp, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIn, ExpIsNull
    , ExpLT, ExpNum, ExpStr, ExpVal, ExpVar, Select, StatementBase
} from "../../sql";
import { EntityTable, VarTable, VarTableWithSchema } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";

// const t1 = 't1';
const pageStart = '$pageStart';

export class BFromStatement<T extends FromStatement> extends BStatement<T> {
    body(sqls: Sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';

        const { fromEntity, asc } = this.istatement;
        let { alias: t1 } = fromEntity;

        const ifStateNull = factory.createIf();
        sqls.push(ifStateNull);
        ifStateNull.cmp = new ExpIsNull(new ExpVar(pageStart));
        const setPageState = factory.createSet();
        ifStateNull.then(setPageState);
        let expStart: ExpVal, cmpPage: ExpCmp;
        let varStart = new ExpVar(pageStart);
        if (asc === 'asc') {
            expStart = new ExpNum(0);
            cmpPage = new ExpGT(new ExpField('id', t1), varStart);
        }
        else {
            expStart = new ExpStr('9223372036854775807');
            cmpPage = new ExpLT(new ExpField('id', t1), varStart);
        }
        setPageState.equ(pageStart, expStart);
        let stat = this.buildFromMain(cmpPage);
        sqls.push(stat);
    }

    protected buildFromMain(cmpPage: ExpCmp) {
        const { factory } = this.context;
        const { intoTbl } = this.istatement;
        let select = this.buildFromSelect(cmpPage);
        if (intoTbl !== undefined) {
            let insert = factory.createInsert();
            insert.select = select;
            insert.table = new VarTable(intoTbl);
            insert.cols = [
                { col: 'id', val: undefined },
                { col: 'ban', val: undefined },
                { col: 'json', val: undefined },
            ];
            return insert;
        }
        else {
            return select;
        }
    }

    private buildFromSelect(cmpPage: ExpCmp): Select {
        const { ban, idFromEntity } = this.istatement;
        let select = this.buildSelect(cmpPage);
        select.column(new ExpField('id', idFromEntity.alias), 'id');
        if (ban === undefined) {
            select.column(ExpNum.num0, 'ban');
        }
        else {
            select.column(this.context.expCmp(ban.val) as ExpVal, 'ban');
        }
        this.buildSelectCols(select, 'json');
        return select;
    }

    protected buildSelectCols(select: Select, alias: string) {
        const { cols } = this.istatement;
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { val, bud } = col;
            /*
            let colArr: Exp[] = field.buildColArr();
            colArr.push(this.context.expVal(val as ValueExpression));
            arr.push(new ExpFunc('JSON_ARRAY', ...colArr));
            */
            arr.push(new ExpFunc('JSON_ARRAY', new ExpNum(bud.id), this.context.expVal(val as ValueExpression)));
        }
        select.column(new ExpFunc('JSON_ARRAY', ...arr), alias);
    }

    private buildSelectFrom(select: Select, fromEntity: FromEntity) {
        const { bizEntityArr, ofIXs, ofOn, alias, subs } = fromEntity;
        let expPrev = new ExpField('id', alias);
        if (ofIXs !== undefined) {
            let len = ofIXs.length;
            for (let i = 0; i < len; i++) {
                let ix = ofIXs[i];
                let tOf = 'of' + i;
                let tBud = 'bud' + i;

                let fieldBase = new ExpField('base', alias);
                let expBase = bizEntityArr.length === 1 ?
                    new ExpEQ(fieldBase, new ExpNum(bizEntityArr[0].id))
                    :
                    new ExpIn(
                        fieldBase,
                        ...bizEntityArr.map(v => new ExpNum(v.id))
                    );
                let wheres: ExpCmp[] = [
                    expBase,
                    new ExpEQ(new ExpField('id', tBud), new ExpField('i', tOf)),
                    new ExpEQ(new ExpField('base', tBud), new ExpNum(ix.id)),
                ];
                if (ofOn !== undefined) {
                    wheres.push(new ExpEQ(expPrev, this.context.expVal(ofOn)));
                }

                select.join(JoinType.join, new EntityTable(EnumSysTable.ixBud, false, tOf))
                    .on(new ExpEQ(new ExpField('x', tOf), expPrev))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, tBud))
                    .on(new ExpAnd(...wheres));
                expPrev = new ExpField('ext', tBud);
            }
        }
        if (subs !== undefined) {
            for (let sub of subs) {
                const { field, fromEntity: subFromEntity } = sub;
                const { bizEntityTable, alias: subAlias } = subFromEntity;
                select
                    .join(JoinType.join, new EntityTable(bizEntityTable, false, subAlias))
                    .on(new ExpEQ(new ExpField('id', subAlias), new ExpField(field, alias)));
                this.buildSelectFrom(select, subFromEntity);
            }
        }
    }

    protected buildSelect(cmpPage: ExpCmp) {
        const { factory } = this.context;
        const { asc, where, fromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        // const bizEntity0 = bizEntityArr[0];
        const select = factory.createSelect();
        select.from(new EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
        /*
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
        */
        let wheres: ExpCmp[] = [
            cmpPage,
            // expBase,
            this.context.expCmp(where),
        ];
        /*
        if (ofOn !== undefined) {
            wheres.push(new ExpEQ(expPrev, this.context.expVal(ofOn)));
        }
        */
        select.where(new ExpAnd(...wheres));
        select.order(new ExpField('id', t0), asc);
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
        const a = MapFieldTable[tblA], b = MapFieldTable[tblB], b1 = 'b1', c = 'c', d = 'd';
        const sheet = MapFieldTable[tblSheet];
        const sheetBin = MapFieldTable[tblSheetBin];
        select.column(new ExpField('id', a), 'pend');
        select.column(new ExpField('id', sheetBin), 'sheet');
        select.column(new ExpField('bin', a), 'id');
        select.column(new ExpField('i', b), 'i');
        select.column(new ExpField('x', b), 'x');
        select.column(new ExpField(binValue, b), binValue);
        select.column(new ExpField(binPrice, b), binPrice);
        select.column(new ExpField(binAmount, b), binAmount);
        select.column(new ExpField('value', a), 'pendvalue');
        select.column(new ExpField('mid', a), 'mid');

        this.buildSelectCols(select, 'cols');

        select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('bin', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizPhrase, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('base', a)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizDetail, false, b1))
            .on(new ExpEQ(new ExpField('id', b1), new ExpField('id', b)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bud, false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('base', b1)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizBin, false, sheetBin))
            .on(new ExpEQ(new ExpField('id', sheetBin), new ExpField('base', d)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizSheet, false, sheet))
            .on(new ExpEQ(new ExpField('id', sheet), new ExpField('id', sheetBin)))
            ;

        let insert = factory.createInsert();
        insert.table = new VarTableWithSchema('$page');
        insert.cols = [
            { col: 'pend', val: undefined },
            { col: 'sheet', val: undefined },
            { col: 'id', val: undefined },
            { col: 'i', val: undefined },
            { col: 'x', val: undefined },
            { col: binValue, val: undefined },
            { col: binPrice, val: undefined },
            { col: binAmount, val: undefined },
            { col: 'pendvalue', val: undefined },
            { col: 'mid', val: undefined },
            { col: 'cols', val: undefined },
        ];
        insert.select = select;
        return insert;
    }
}
