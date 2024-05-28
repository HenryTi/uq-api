"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInPend = void 0;
const consts_1 = require("../../../consts");
const il_1 = require("../../../il");
const from_atom_1 = require("./from.atom");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const BizField_1 = require("../BizField");
class BFromStatementInPend extends from_atom_1.BFromStatement {
    buildFromMain(cmpStart) {
        const { factory } = this.context;
        let select = super.buildSelect(cmpStart);
        let tblA = 'pend';
        let tblB = 'bin';
        let tblSheet = 'sheet';
        let tblSheetBin = 'sheetBin';
        const a = BizField_1.MapFieldTable[tblA], b = BizField_1.MapFieldTable[tblB], b1 = 'b1', c = 'c', d = 'd';
        const sheet = BizField_1.MapFieldTable[tblSheet];
        const sheetBin = BizField_1.MapFieldTable[tblSheetBin];
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
        return [insert];
    }
}
exports.BFromStatementInPend = BFromStatementInPend;
//# sourceMappingURL=from.inPend.js.map