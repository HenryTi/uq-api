import { BizLog, EnumSysTable } from "../../../il";
import { BStatement, Sqls } from "../../bstatement";
import { ExpFuncInUq, ExpNull, ExpNum, ExpVar } from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";

export class BBizLog extends BStatement<BizLog> {
    body(sqls: Sqls): void {
        const { factory, userParam } = this.context;
        const insert = factory.createInsert();
        sqls.push(insert);
        insert.ignore = true;
        insert.table = new EntityTable(EnumSysTable.log, false);
        const varSite = new ExpVar('$site');
        insert.cols.push(
            { col: 'id', val: new ExpFuncInUq('log$id', [varSite, new ExpVar(userParam.name), ExpNum.num1, ExpNull.null, varSite], true) },
            { col: 'base', val: varSite },
            { col: 'value', val: this.context.expVal(this.istatement.val) },
        );
    }
}
