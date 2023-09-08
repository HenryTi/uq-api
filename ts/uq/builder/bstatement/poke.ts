import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { PokeStatement } from "../../il";
import { convertExp, ExpNum, ExpVal } from "../sql";
import { EnumSysTable, sysTable } from "../dbContext";

export class BPokeStatement extends BStatement {
    protected istatement: PokeStatement;
    body(sqls: Sqls) {
        let { user } = this.istatement;
        let { factory } = this.context;
        let upsert = factory.createUpsert();
        sqls.push(upsert);
        let val = convertExp(this.context, user) as ExpVal;
        upsert.table = sysTable(EnumSysTable.user);
        upsert.keys = [{
            col: 'id',
            val,
        }];
        upsert.cols = [{
            col: 'poke',
            val: ExpNum.num1,
        }];
    }
}
