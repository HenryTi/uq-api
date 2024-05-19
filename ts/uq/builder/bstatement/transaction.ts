import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumTransaction, TransactionStatement } from "../../il";

export class BTransactionStatement extends BStatement<TransactionStatement> {
    body(sqls: Sqls) {
        let { act } = this.istatement;
        let { factory } = this.context;
        switch (act) {
            case EnumTransaction.start:
                sqls.push(factory.createTransaction());
                break;
            case EnumTransaction.commit:
                sqls.push(factory.createCommit());
                break;
        }
    }
}
