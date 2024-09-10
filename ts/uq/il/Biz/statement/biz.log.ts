import { BBizLog, DbContext } from "../../../builder";
import { PBizLog, PContext, PElement } from "../../../parser";
import { ValueExpression } from "../../Exp";
import { Statement } from "../../statement";

export class BizLog extends Statement {
    val: ValueExpression;

    db(db: DbContext): object {
        return new BBizLog(db, this);
    }
    parser(context: PContext): PElement {
        return new PBizLog(this, context);
    }
}
