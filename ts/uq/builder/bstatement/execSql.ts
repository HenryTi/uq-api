import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { ExecSqlStatement } from "../../il";
import { convertExp, ExpVal } from "../sql";

export class BExecSqlStatement extends BStatement<ExecSqlStatement> {
    override body(sqls: Sqls) {
        let { sql, toVarPointer, toVar } = this.istatement;
        let factory = this.context.factory;
        let execSql = factory.createExecSql();
        sqls.push(execSql);
        execSql.no = this.istatement.no;
        execSql.toVar = toVar;
        execSql.toVarPoint = toVarPointer;
        execSql.sql = convertExp(this.context, sql) as ExpVal;
    }
}
