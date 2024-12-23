import {
    BizStatementID
} from "../../../il";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";

export abstract class BBizStatementID<T extends BizStatementID> extends BStatement<T> {
    override body(sqls: Sqls): void {
    }
}
