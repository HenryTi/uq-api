import { BizBud, BudDataType, EnumSysTable } from "../../il";
import { DbContext } from "../dbContext";
import { ExpNum, ExpVal, Statement } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

export function buildSetAtomBud(context: DbContext, bud: BizBud, idVal: ExpVal, expVal: ExpVal) {
    const { factory } = context;
    let statements: Statement[];
    switch (bud.dataType) {
        default:
            statements = buildSetValueBud(idVal, bud, expVal);
            break;
        case BudDataType.radio:
            statements = buildSetRadioBud(idVal, bud, expVal);
            break;
        case BudDataType.check:
            statements = buildSetCheckBud(idVal, bud, expVal);
            break;
    }
    return statements;

    function buildSetValueBud(varId: ExpVal, bud: BizBud, val: ExpVal): Statement[] {
        let insertDup = factory.createInsertOnDuplicate();
        let statements: Statement[] = [insertDup];
        let tbl: EnumSysTable;
        switch (bud.dataType) {
            default: tbl = EnumSysTable.ixBudInt; break;
            case BudDataType.dec: tbl = EnumSysTable.ixBudDec; break;
            case BudDataType.str:
            case BudDataType.char: tbl = EnumSysTable.ixBudStr; break;
        }
        insertDup.keys = [
            { col: 'i', val: varId },
            { col: 'x', val: new ExpNum(bud.id) },
        ];
        insertDup.cols = [
            { col: 'value', val }
        ];
        insertDup.table = new EntityTable(tbl, false);
        return statements;
    }

    function buildSetRadioBud(varId: ExpVal, bud: BizBud, val: ExpVal): Statement[] {
        let statements: Statement[] = [];
        return statements;
    }

    function buildSetCheckBud(varId: ExpVal, bud: BizBud, val: ExpVal): Statement[] {
        let statements: Statement[] = [];
        return statements;
    }
}
