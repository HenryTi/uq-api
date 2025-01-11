import { BizBud, EnumSysTable, JoinType } from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import { ExpAnd, ExpEQ, ExpField, ExpFuncInUq, ExpNum, ExpVal, ExpVar, Statement } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

const a = 'a', b = 'b';
export function buildSetAtomBud(context: DbContext, bud: BizBud, idVal: ExpVal, expVal: ExpVal, noOfState: number) {
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
            default: tbl = EnumSysTable.ixInt; break;
            case BudDataType.dec: tbl = EnumSysTable.ixDec; break;
            case BudDataType.str:
            case BudDataType.char: tbl = EnumSysTable.ixStr; break;
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
        let del = factory.createDelete();
        statements.push(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.ix, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('x', a)));
        del.where(new ExpAnd(
            new ExpEQ(new ExpField('i', a), varId),
            new ExpEQ(new ExpField('base', b), new ExpNum(bud.id)),
            // new ExpEQ(new ExpField('ext', b), val)
        ));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new EntityTable(EnumSysTable.ix, false);
        insert.cols = [
            { col: 'i', val: varId },
            {
                col: 'x', val: new ExpFuncInUq('bud$id', [
                    ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNum.num_1
                    , new ExpNum(bud.id), val
                ], true)
            },
        ];
        return statements;
    }

    function buildSetCheckBud(varId: ExpVal, bud: BizBud, val: ExpVal): Statement[] {
        let statements: Statement[] = [];
        return statements;
    }
}
