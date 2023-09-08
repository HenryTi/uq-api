import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { DeleteStatement } from "../../il";
import { convertDelete } from "../sql/select";

export class BDeleteStatement extends BStatement {
    protected istatement: DeleteStatement;
    body(sqls: Sqls) {
        sqls.push(convertDelete(this.context, this.istatement.del));
        /*
        let {from, where, tableAlias} = this.istatement.del;
        let del = this.context.factory.createDelete();
        sqls.push(del);
        del.tables = [new EntityTable(from.name, from.type==='tuid'?!from.global:true, tableAlias)];
        del.where(convertExp(this.context, where) as ExpCmp);
        */
    }
}
