"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInPend = exports.BFromStatement = void 0;
const consts_1 = require("../../consts");
const il_1 = require("../../il");
const Biz_1 = require("../Biz");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
// const t1 = 't1';
const pageStart = '$pageStart';
class BFromStatement extends bstatement_1.BStatement {
    body(sqls) {
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
        ifStateNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(pageStart));
        const setPageState = factory.createSet();
        ifStateNull.then(setPageState);
        let expStart, cmpStart;
        let varStart = new sql_1.ExpVar(pageStart);
        if (asc === 'asc') {
            expStart = new sql_1.ExpNum(0);
            cmpStart = new sql_1.ExpGT(new sql_1.ExpField('id', t1), varStart);
        }
        else {
            expStart = new sql_1.ExpStr('9223372036854775807');
            cmpStart = new sql_1.ExpLT(new sql_1.ExpField('id', t1), varStart);
        }
        setPageState.equ(pageStart, expStart);
        const fromMain = this.buildFromMain(cmpStart);
        sqls.push(fromMain);
    }
    buildFromMain(cmpStart) {
        const { ban, fromEntity: { alias: t1 } } = this.istatement;
        let select = this.buildSelect(cmpStart);
        select.column(new sql_1.ExpField('id', t1), 'id');
        if (ban === undefined) {
            select.column(sql_1.ExpNum.num0, 'ban');
        }
        else {
            select.column(this.context.expCmp(ban.val), 'ban');
        }
        this.buildSelectCols(select, 'json');
        return select;
    }
    buildSelectCols(select, alias) {
        const { cols } = this.istatement;
        /*
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { name, val, field } = col;
            let colArr: Exp[] = field.buildColArr();
            colArr.push(this.context.expVal(val as ValueExpression));
            arr.push(new ExpFunc('JSON_ARRAY', ...colArr));
        }
        select.column(new ExpFunc('JSON_ARRAY', ...arr), alias);
        */
    }
    buildSelect(cmpStart) {
        const { factory } = this.context;
        const { asc, where, fromEntity: { bizEntityTable, bizEntityArr, ofIXs, ofOn, alias: t1 } } = this.istatement;
        const bizEntity0 = bizEntityArr[0];
        const select = factory.createSelect();
        select.from(new statementWithFrom_1.EntityTable(bizEntityTable, false, t1));
        let expPrev = new sql_1.ExpField('id', t1);
        if (ofIXs !== undefined) {
            let len = ofIXs.length;
            for (let i = 0; i < len; i++) {
                let ix = ofIXs[i];
                let tOf = 'of' + i;
                let tBud = 'bud' + i;
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false, tOf))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('x', tOf), expPrev))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, tBud))
                    .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', tBud), new sql_1.ExpField('i', tOf)), new sql_1.ExpEQ(new sql_1.ExpField('base', tBud), new sql_1.ExpNum(ix.id))));
                expPrev = new sql_1.ExpField('ext', tBud);
            }
        }
        let fieldBase = new sql_1.ExpField('base', t1);
        let expBase = bizEntityArr.length === 1 ?
            new sql_1.ExpEQ(fieldBase, new sql_1.ExpNum(bizEntity0.id))
            :
                new sql_1.ExpIn(fieldBase, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
        let wheres = [
            cmpStart,
            expBase,
            this.context.expCmp(where),
        ];
        if (ofOn !== undefined) {
            wheres.push(new sql_1.ExpEQ(expPrev, this.context.expVal(ofOn)));
        }
        select.where(new sql_1.ExpAnd(...wheres));
        select.order(new sql_1.ExpField('id', t1), asc);
        select.limit(new sql_1.ExpVar('$pageSize'));
        return select;
    }
}
exports.BFromStatement = BFromStatement;
class BFromStatementInPend extends BFromStatement {
    buildFromMain(cmpStart) {
        const { factory } = this.context;
        let select = super.buildSelect(cmpStart);
        let tblA = 'pend';
        let tblB = 'bin';
        let tblSheet = 'sheet';
        let tblSheetBin = 'sheetBin';
        const a = Biz_1.MapFieldTable[tblA], b = Biz_1.MapFieldTable[tblB], b1 = 'b1', c = 'c', d = 'd';
        const sheet = Biz_1.MapFieldTable[tblSheet];
        const sheetBin = Biz_1.MapFieldTable[tblSheetBin];
        select.column(new sql_1.ExpField('id', a), 'pend');
        select.column(new sql_1.ExpField('id', sheetBin), 'sheet');
        select.column(new sql_1.ExpField('bin', a), 'id');
        select.column(new sql_1.ExpField('i', b), 'i');
        select.column(new sql_1.ExpField('x', b), 'x');
        select.column(new sql_1.ExpField(consts_1.binValue, b), consts_1.binValue);
        select.column(new sql_1.ExpField(consts_1.binPrice, b), consts_1.binPrice);
        select.column(new sql_1.ExpField(consts_1.binAmount, b), consts_1.binAmount);
        select.column(new sql_1.ExpField('value', a), 'pendvalue');
        select.column(new sql_1.ExpField('mid', a), 'mid');
        this.buildSelectCols(select, 'cols');
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('bin', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', a)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizDetail, false, b1))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b1), new sql_1.ExpField('id', b)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('base', b1)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, sheetBin))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', sheetBin), new sql_1.ExpField('base', d)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizSheet, false, sheet))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', sheet), new sql_1.ExpField('id', sheetBin)));
        let insert = factory.createInsert();
        insert.table = new statementWithFrom_1.VarTableWithSchema('$page');
        insert.cols = [
            { col: 'pend', val: undefined },
            { col: 'sheet', val: undefined },
            { col: 'id', val: undefined },
            { col: 'i', val: undefined },
            { col: 'x', val: undefined },
            { col: consts_1.binValue, val: undefined },
            { col: consts_1.binPrice, val: undefined },
            { col: consts_1.binAmount, val: undefined },
            { col: 'pendvalue', val: undefined },
            { col: 'mid', val: undefined },
            { col: 'cols', val: undefined },
        ];
        insert.select = select;
        return insert;
    }
}
exports.BFromStatementInPend = BFromStatementInPend;
//# sourceMappingURL=from.js.map