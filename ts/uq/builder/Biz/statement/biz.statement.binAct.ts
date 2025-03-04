import {
    BizStatementBinAct
} from "../../../il";
import { ExpFunc, ExpNum, ExpStr, ExpVar } from "../../sql";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";
import { $site } from "../../consts";

export class BBizStatementBinAct extends BStatement<BizStatementBinAct> {
    // 可以发送sheet主表，也可以是Detail
    override body(sqls: Sqls) {
        const { context } = this;
        const { factory, site, varUser } = context;
        const { no, bizStatement: { bizAct: { binState: { bin, sheetState: { sheet } } } } } = this.istatement;
        if (bin.act === undefined) return;
        const execSql = factory.createExecSql();
        execSql.no = no;
        sqls.push(execSql);
        execSql.sql = new ExpFunc(
            factory.func_concat,
            new ExpStr(`CALL \`${$site}.${site}\`.\``),
            new ExpNum(bin.id),
            new ExpStr('`(?,?,?)'),
        );
        execSql.parameters = [
            varUser,                // $user
            new ExpVar('$bin'),
        ];
    }
}
