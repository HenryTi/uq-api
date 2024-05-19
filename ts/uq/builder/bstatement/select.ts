import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { SelectStatement } from "../../il";
import { convertSelect } from "../sql/select";

export class BSelect extends BStatement<SelectStatement> {
    body(sqls: Sqls) {
        sqls.push(convertSelect(this.context, this.istatement.select));
    }
}

