"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSetAtomBud = exports.buildSetSheetBud = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
function buildSetSheetBud(context, bud, idVal, expVal) {
    const { factory } = context;
    function createIxBudValue(table, valValue) {
        let insert = factory.createInsertOnDuplicate();
        // insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable(table, false);
        insert.cols = [
            { col: 'value', val: valValue },
        ];
        insert.keys = [
            { col: 'i', val: idVal },
            { col: 'x', val: new sql_1.ExpNum(bud.id) },
        ];
        return insert;
    }
    const createIxBud = (table, valValue) => {
        // 这个地方，可能正确的做法，应该是i=bud$id(valId, bud.id);
        // 暂时先这样
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable(table, false);
        insert.cols = [
            { col: 'i', val: idVal },
            { col: 'x', val: valValue },
        ];
        return insert;
    };
    let statement;
    switch (bud.dataType) {
        default:
            debugger;
            return;
        case il_1.BudDataType.check:
            debugger;
            break;
        case il_1.BudDataType.datetime:
            debugger;
            break;
        case il_1.BudDataType.int: // break;
        case il_1.BudDataType.atom:
            statement = createIxBudValue(il_1.EnumSysTable.ixBudInt, expVal);
            break;
        case il_1.BudDataType.char:
        case il_1.BudDataType.str:
            statement = createIxBudValue(il_1.EnumSysTable.ixBudStr, expVal);
            break;
        case il_1.BudDataType.radio:
            statement = createIxBud(il_1.EnumSysTable.ixBud, expVal);
            break;
        case il_1.BudDataType.date:
            // insert = createIxBudValue(EnumSysTable.ixBudInt, new ExpNum(10000) /* expVal*/);
            statement = createIxBudValue(il_1.EnumSysTable.ixBudInt, expVal);
            break;
        case il_1.BudDataType.dec:
            statement = createIxBudValue(il_1.EnumSysTable.ixBudDec, expVal);
            break;
    }
    return [statement];
}
exports.buildSetSheetBud = buildSetSheetBud;
function buildSetAtomBud(context, bud, idVal, expVal) {
    const { factory } = context;
    let statements;
    switch (bud.dataType) {
        default:
            statements = buildSetValueBud(idVal, bud, expVal);
            break;
        case il_1.BudDataType.radio:
            statements = buildSetRadioBud(idVal, bud, expVal);
            break;
        case il_1.BudDataType.check:
            statements = buildSetCheckBud(idVal, bud, expVal);
            break;
    }
    return statements;
    function buildSetValueBud(varId, bud, val) {
        let insertDup = factory.createInsertOnDuplicate();
        let statements = [insertDup];
        let tbl;
        switch (bud.dataType) {
            default:
                tbl = il_1.EnumSysTable.ixBudInt;
                break;
            case il_1.BudDataType.dec:
                tbl = il_1.EnumSysTable.ixBudDec;
                break;
            case il_1.BudDataType.str:
            case il_1.BudDataType.char:
                tbl = il_1.EnumSysTable.ixBudStr;
                break;
        }
        insertDup.keys = [
            { col: 'i', val: varId },
            { col: 'x', val: new sql_1.ExpNum(bud.id) },
        ];
        insertDup.cols = [
            { col: 'value', val }
        ];
        insertDup.table = new statementWithFrom_1.EntityTable(tbl, false);
        return statements;
    }
    function buildSetRadioBud(varId, bud, val) {
        let statements = [];
        return statements;
    }
    function buildSetCheckBud(varId, bud, val) {
        let statements = [];
        return statements;
    }
}
exports.buildSetAtomBud = buildSetAtomBud;
//# sourceMappingURL=buildSetBud.js.map