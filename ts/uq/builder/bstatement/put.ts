import { Char, PutStatement } from "../../il";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BPutStatement extends BStatement<PutStatement> {
    body(sqls: Sqls) {
        const { factory } = this.context;
        let { putName, val } = this.istatement;
        putName = putName ?? '$';
        const varName = '$put$' + putName;
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(varName, new Char(200));
        declare.put(putName);
        const set = factory.createSet();
        sqls.push(set);
        set.equ(varName, this.context.expVal(val));
    }
}
