import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { LogStatement } from "../../il";
import { convertExp, ExpStr, ExpVal, ExpVar } from "../sql";

export class BLogStatement extends BStatement<LogStatement> {
    override body(sqls: Sqls) {
        let { unit, uq, subject, content, isError } = this.istatement;
        let { factory, unitFieldName } = this.context;
        let log = factory.createLog();
        log.isError = isError;
        sqls.push(log);
        log.unit = convertExp(this.context, unit) as ExpVal;
        if (!log.unit) {
            log.unit = new ExpVar(unitFieldName);
        }
        log.uq = convertExp(this.context, uq) as ExpVal;
        if (!log.uq) {
            log.uq = new ExpStr(this.context.dbName);
        }
        log.subject = convertExp(this.context, subject) as ExpVal;
        log.content = convertExp(this.context, content) as ExpVal;
    }
}
