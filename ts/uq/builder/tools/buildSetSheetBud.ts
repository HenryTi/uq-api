import { BizBud, EnumSysTable } from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import { ExpNum, ExpVal, Statement } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

export function buildSetSheetBud(context: DbContext, bud: BizBud, idVal: ExpVal, expVal: ExpVal) {
    const { factory } = context;
    function createIxBudValue(table: EnumSysTable, valValue: ExpVal) {
        let insert = factory.createInsertOnDuplicate();
        insert.table = new EntityTable(table, false);
        insert.cols = [
            { col: 'value', val: valValue },
        ];
        insert.keys = [
            { col: 'i', val: idVal },
            { col: 'x', val: new ExpNum(bud.id) },
        ];
        return insert;
    }
    const createIxBud = (table: EnumSysTable, valValue: ExpVal) => {
        // 这个地方，可能正确的做法，应该是i=bud$id(valId, bud.id);
        // 暂时先这样
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new EntityTable(table, false);
        insert.cols = [
            { col: 'i', val: idVal },
            { col: 'x', val: valValue },
        ]
        return insert;
    }
    let statement: Statement;
    switch (bud.dataType) {
        default: debugger; return;
        case BudDataType.check: debugger; break;
        case BudDataType.datetime: debugger; break;
        case BudDataType.int: // break;
        case BudDataType.atom:
            statement = createIxBudValue(EnumSysTable.ixBudInt, expVal);
            break;
        case BudDataType.char:
        case BudDataType.str:
            statement = createIxBudValue(EnumSysTable.ixBudStr, expVal);
            break;
        case BudDataType.radio:
            statement = createIxBud(EnumSysTable.ixBud, expVal);
            break;
        case BudDataType.date:
            statement = createIxBudValue(EnumSysTable.ixBudInt, expVal);
            break;
        case BudDataType.dec:
            statement = createIxBudValue(EnumSysTable.ixBudDec, expVal);
            break;
        case BudDataType.fork:
            statement = createIxBudValue(EnumSysTable.ixBudJson, expVal);
            break;
    }
    return [statement];
}
