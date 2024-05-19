import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { InlineStatement } from "../../il";

export class BInlineStatement extends BStatement<InlineStatement> {
    body(sqls: Sqls) {
        let factory = this.context.factory;
        let inline = factory.createInline();
        inline.dbType = this.istatement.dbType;
        inline.code = this.istatement.code;
        inline.memo = this.istatement.memo;
        sqls.push(inline);
    }
}
