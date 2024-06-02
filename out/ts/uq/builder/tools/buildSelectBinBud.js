"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSelectBinBud = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a', b = 'b';
function buildSelectBinBud(context, bud, varBin, varName) {
    const { factory } = context;
    const bigint = new il_1.BigInt();
    const decValue = new il_1.Dec(18, 6);
    const str = new il_1.Char(200);
    const json = new il_1.JsonDataType();
    let declare = factory.createDeclare();
    let statements = [declare];
    const { name, dataType } = bud;
    if (varName === undefined)
        varName = name;
    let declareType;
    let selectBud;
    switch (dataType) {
        default: throw new Error('unknown type ' + il_1.EnumDataType[dataType]);
        case BizPhraseType_1.BudDataType.none:
            return [];
        case BizPhraseType_1.BudDataType.atom:
            if (bud.isIxBase === true) {
                selectBud = buildSelectBudIxBase(bud);
            }
            else {
                selectBud = buildSelectBudValue(bud, il_1.EnumSysTable.ixBudInt);
            }
            declareType = bigint;
            break;
        case BizPhraseType_1.BudDataType.ID:
        case BizPhraseType_1.BudDataType.date:
        case BizPhraseType_1.BudDataType.int:
        case BizPhraseType_1.BudDataType.radio:
            selectBud = buildSelectBudValue(bud, il_1.EnumSysTable.ixBudInt);
            declareType = bigint;
            break;
        case BizPhraseType_1.BudDataType.str:
        case BizPhraseType_1.BudDataType.char:
            selectBud = buildSelectBudValue(bud, il_1.EnumSysTable.ixBudStr);
            declareType = str;
            break;
        case BizPhraseType_1.BudDataType.dec:
            selectBud = buildSelectBudValue(bud, il_1.EnumSysTable.ixBudDec);
            declareType = decValue;
            break;
        case BizPhraseType_1.BudDataType.check:
            selectBud = buildSelectBudIx(bud, false);
            declareType = json;
            break;
    }
    statements.push(selectBud);
    declare.var(varName, declareType);
    return statements;
    function buildSelectBudValue(bud, tbl) {
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        selectBud.col('value', varName, a);
        selectBud.from(new statementWithFrom_1.EntityTable(tbl, false, a));
        selectBud.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varBin), new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpNum(bud.id))));
        return selectBud;
    }
    function buildSelectBudIx(bud, isRadio) {
        const { name: budName } = bud;
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        let exp = isRadio === true ?
            new sql_1.ExpField('x', a)
            : new sql_1.ExpFunc('JSON_ARRAYAGG', new sql_1.ExpField('x', a));
        selectBud.column(exp, budName);
        selectBud.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false, a));
        selectBud.where(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varBin));
        return selectBud;
    }
    function buildSelectBudIxBase(bud) {
        const { name: budName } = bud;
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        selectBud.column(new sql_1.ExpField('base', b), budName);
        selectBud.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField(budName.substring(1), a)));
        selectBud.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), varBin));
        return selectBud;
    }
}
exports.buildSelectBinBud = buildSelectBinBud;
//# sourceMappingURL=buildSelectBinBud.js.map