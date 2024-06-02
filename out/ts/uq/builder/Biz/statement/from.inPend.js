"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromInPendStatement = void 0;
const consts_1 = require("../../../consts");
const il_1 = require("../../../il");
const from_1 = require("./from");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const BizField_1 = require("../BizField");
const a = 'a', b = 'b';
class BFromInPendStatement extends from_1.BFromStatement {
    constructor(context, istatement) {
        super(context, istatement);
        // no ids in FromInPend
        this.asc = il_1.EnumAsc.asc;
        // this.idFromEntity = undefined;
    }
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
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
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
    buildFromEntity(sqls) {
        // let { bizEntityArr } = this.idFromEntity;
        // let entityArr: BizAtom[] = bizEntityArr as BizAtom[];
        let insertAtom = this.buildInsertAtomDirect();
        sqls.push(insertAtom);
        // let entity = entityArr[0];
        // this.buildInsertAtomBuds(sqls, entity);
    }
    buildInsertAtomDirect() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new statementWithFrom_1.VarTable('ret', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', b)));
        return insert;
    }
}
exports.BFromInPendStatement = BFromInPendStatement;
//# sourceMappingURL=from.inPend.js.map