import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { DeleteStatement } from "../../il";
import { convertDelete } from "../sql/select";

export class BDeleteStatement extends BStatement<DeleteStatement> {
    override body(sqls: Sqls) {
        sqls.push(convertDelete(this.context, this.istatement.del));
    }
}
