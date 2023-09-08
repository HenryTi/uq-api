import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { SetStatement } from "../../il";

export class BFailStatement extends BStatement {
    protected istatement: SetStatement;

    body(sqls: Sqls) {
        let factory = this.context.factory;
        let ret = factory.createLeaveProc();
        sqls.push(ret);
    }
}
