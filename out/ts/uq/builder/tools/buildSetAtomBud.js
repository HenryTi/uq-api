"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSetAtomBud = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a', b = 'b';
function buildSetAtomBud(context, bud, idVal, expVal, noOfState) {
    const { factory } = context;
    let statements;
    switch (bud.dataType) {
        default:
            statements = buildSetValueBud(idVal, bud, expVal);
            break;
        case BizPhraseType_1.BudDataType.radio:
            statements = buildSetRadioBud(idVal, bud, expVal);
            break;
        case BizPhraseType_1.BudDataType.check:
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
                tbl = il_1.EnumSysTable.ixInt;
                break;
            case BizPhraseType_1.BudDataType.dec:
                tbl = il_1.EnumSysTable.ixDec;
                break;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                tbl = il_1.EnumSysTable.ixStr;
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
        let del = factory.createDelete();
        statements.push(del);
        del.tables = [a];
        del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ix, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('x', a)));
        del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varId), new sql_1.ExpEQ(new sql_1.ExpField('base', b), new sql_1.ExpNum(bud.id))));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ix, false);
        insert.cols = [
            { col: 'i', val: varId },
            {
                col: 'x', val: new sql_1.ExpFuncInUq('bud$id', [
                    sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNum.num_1,
                    new sql_1.ExpNum(bud.id), val
                ], true)
            },
        ];
        return statements;
    }
    function buildSetCheckBud(varId, bud, val) {
        let statements = [];
        return statements;
    }
}
exports.buildSetAtomBud = buildSetAtomBud;
//# sourceMappingURL=buildSetAtomBud.js.map