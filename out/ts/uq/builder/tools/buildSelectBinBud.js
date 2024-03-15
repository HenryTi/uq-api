"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSelectBinBud = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a';
function buildSelectBinBud(context, bud, varBin) {
    const { factory } = context;
    const bigint = new il_1.BigInt();
    const decValue = new il_1.Dec(18, 6);
    const str = new il_1.Char(200);
    const json = new il_1.JsonDataType();
    let declare = factory.createDeclare();
    let statements = [declare];
    const { name, dataType } = bud;
    let declareType;
    let selectBud;
    switch (dataType) {
        default: throw new Error('unknown type ' + il_1.EnumDataType[dataType]);
        case il_1.BudDataType.none:
            return;
        case il_1.BudDataType.ID:
        case il_1.BudDataType.atom:
        case il_1.BudDataType.date:
        case il_1.BudDataType.int:
            selectBud = buildSelectBudValue(bud, il_1.EnumSysTable.ixBudInt);
            declareType = bigint;
            break;
        case il_1.BudDataType.str:
        case il_1.BudDataType.char:
            selectBud = buildSelectBudValue(bud, il_1.EnumSysTable.ixBudStr);
            declareType = str;
            break;
        case il_1.BudDataType.dec:
            selectBud = buildSelectBudValue(bud, il_1.EnumSysTable.ixBudDec);
            declareType = decValue;
            break;
        case il_1.BudDataType.radio:
            selectBud = buildSelectBudIx(bud, true);
            declareType = bigint;
            break;
        case il_1.BudDataType.check:
            selectBud = buildSelectBudIx(bud, false);
            declareType = json;
            break;
    }
    statements.push(selectBud);
    declare.var(name, declareType);
    return statements;
    function buildSelectBudValue(bud, tbl) {
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        selectBud.col('value', bud.name, a);
        selectBud.from(new statementWithFrom_1.EntityTable(tbl, false, a));
        selectBud.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varBin), new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpNum(bud.id))));
        return selectBud;
    }
    function buildSelectBudIx(bud, isRadio) {
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        let exp = isRadio === true ?
            new sql_1.ExpField('x', a)
            : new sql_1.ExpFunc('JSON_ARRAYAGG', new sql_1.ExpField('x', a));
        selectBud.column(exp, bud.name);
        selectBud.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false, a));
        selectBud.where(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varBin));
        return selectBud;
    }
}
exports.buildSelectBinBud = buildSelectBinBud;
//# sourceMappingURL=buildSelectBinBud.js.map