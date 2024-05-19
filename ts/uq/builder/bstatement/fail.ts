import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { FailStatement } from "../../il";

export class BFailStatement extends BStatement<FailStatement> {
    body(sqls: Sqls) {
        let factory = this.context.factory;
        let ret = factory.createLeaveProc();
        sqls.push(ret);
    }
}
