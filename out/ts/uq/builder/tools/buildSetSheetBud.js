"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSetSheetBud = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
function buildSetSheetBud(context, bud, idVal, expVal) {
    const { factory } = context;
    function createIxBudValue(table, valValue) {
        let insert = factory.createInsertOnDuplicate();
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
        case BizPhraseType_1.BudDataType.check:
            debugger;
            break;
        case BizPhraseType_1.BudDataType.datetime:
            debugger;
            break;
        case BizPhraseType_1.BudDataType.int: // break;
        case BizPhraseType_1.BudDataType.atom:
            statement = createIxBudValue(il_1.EnumSysTable.ixBudInt, expVal);
            break;
        case BizPhraseType_1.BudDataType.char:
        case BizPhraseType_1.BudDataType.str:
            statement = createIxBudValue(il_1.EnumSysTable.ixBudStr, expVal);
            break;
        case BizPhraseType_1.BudDataType.radio:
            statement = createIxBud(il_1.EnumSysTable.ixBud, expVal);
            break;
        case BizPhraseType_1.BudDataType.date:
            // insert = createIxBudValue(EnumSysTable.ixBudInt, new ExpNum(10000) /* expVal*/);
            statement = createIxBudValue(il_1.EnumSysTable.ixBudInt, expVal);
            break;
        case BizPhraseType_1.BudDataType.dec:
            statement = createIxBudValue(il_1.EnumSysTable.ixBudDec, expVal);
            break;
    }
    return [statement];
}
exports.buildSetSheetBud = buildSetSheetBud;
//# sourceMappingURL=buildSetSheetBud.js.map