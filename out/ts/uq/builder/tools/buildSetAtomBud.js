"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSetAtomBud = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
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
//# sourceMappingURL=buildSetAtomBud.js.map