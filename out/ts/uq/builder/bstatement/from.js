"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInPend = exports.BFromStatement = void 0;
const il_1 = require("../../il");
const Biz_1 = require("../Biz");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
const t1 = 't1';
const pageStart = '$pageStart';
class BFromStatement extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';
        const { asc } = this.istatement;
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
        const { ban, cols } = this.istatement;
        let select = this.buildSelect(cmpStart);
        select.column(new sql_1.ExpField('id', t1), 'id');
        if (ban === undefined) {
            select.column(sql_1.ExpNum.num0, 'ban');
        }
        else {
            select.column(this.context.expCmp(ban.val), 'ban');
        }
        const arr = [];
        for (let col of cols) {
            const { name, val, field } = col;
            let colArr = field.buildColArr();
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
            colArr.push(this.context.expVal(val));
            arr.push(new sql_1.ExpFunc('JSON_ARRAY', ...colArr));
        }
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'json');
        return select;
    }
    buildSelect(cmpStart) {
        const { factory } = this.context;
        const { asc, where, bizEntityTable, bizEntityArr, ofIXs, ofOn } = this.istatement;
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
        const a = Biz_1.MapFieldTable[tblA], b = Biz_1.MapFieldTable[tblB], c = 'c', d = 'd';
        const sheet = Biz_1.MapFieldTable[tblSheet];
        const sheetBin = Biz_1.MapFieldTable[tblSheetBin];
        select.column(new sql_1.ExpField('id', a), 'pend');
        select.column(new sql_1.ExpField('base', d), 'sheet');
        select.column(new sql_1.ExpField('bin', a), 'id');
        select.column(new sql_1.ExpField('i', b), 'i');
        select.column(new sql_1.ExpField('x', b), 'x');
        select.column(new sql_1.ExpField('value', b), 'value');
        select.column(new sql_1.ExpField('price', b), 'price');
        select.column(new sql_1.ExpField('amount', b), 'amount');
        select.column(new sql_1.ExpField('mid', a), 'mid');
        select.column(new sql_1.ExpField('value', a), 'pendvalue');
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('bin', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', a)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('id', b)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, sheetBin))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', sheetBin), new sql_1.ExpField('base', d)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.sheet, false, sheet))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', sheet), new sql_1.ExpField('id', sheetBin)));
        let insert = factory.createInsert();
        insert.table = new statementWithFrom_1.VarTableWithSchema('$page');
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
exports.BFromStatementInPend = BFromStatementInPend;
//# sourceMappingURL=from.js.map