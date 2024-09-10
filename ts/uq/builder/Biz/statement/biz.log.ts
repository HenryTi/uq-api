import { bigIntField, BizLog, EnumSysTable } from "../../../il";
import { BStatement, Sqls } from "../../bstatement";
import { ExpEQ, ExpField, ExpFuncInUq, ExpNull, ExpNum, ExpVar } from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";

export class BBizLog extends BStatement<BizLog> {
    body(sqls: Sqls): void {
        const { factory, userParam } = this.context;
        let { no } = this.istatement;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let logId = 'logid_' + no;
        declare.vars(bigIntField(logId));
        let setId = factory.createSet();
        sqls.push(setId);
        const varSite = new ExpVar('$site');
        setId.equ(logId, new ExpFuncInUq('log$id', [varSite, new ExpVar(userParam.name), ExpNum.num1, ExpNull.null, varSite], true));

        const update = factory.createUpdate();
        sqls.push(update);
        update.table = new EntityTable(EnumSysTable.log, false);
        update.cols.push(
            { col: 'value', val: this.context.expVal(this.istatement.val) },
        );
        update.where = new ExpEQ(new ExpField('id'), new ExpVar(logId));
    }
}
