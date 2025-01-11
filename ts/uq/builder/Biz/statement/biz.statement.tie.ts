import {
    EnumSysTable, BizStatementTie
} from "../../../il";
import { ExpFuncInUq, ExpNull, ExpNum } from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";

export class BBizStatementTie extends BStatement<BizStatementTie> {
    override body(sqls: Sqls): void {
        const { tie, i, x } = this.istatement;
        const { factory } = this.context;
        let insert = factory.createInsert();
        sqls.push(insert);
        let iVal = new ExpFuncInUq('bud$id', [
            ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNull.null
            , new ExpNum(tie.id)
            , this.context.expVal(i),
        ], true);
        insert.cols = [
            { col: 'i', val: iVal },
            { col: 'x', val: this.context.expVal(x) },
        ]
        insert.table = new EntityTable(EnumSysTable.ix, false);
        insert.ignore = true;
    }
}

