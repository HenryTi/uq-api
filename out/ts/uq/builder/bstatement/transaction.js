"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTransactionStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
class BTransactionStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { act } = this.istatement;
        let { factory } = this.context;
        switch (act) {
            case il_1.EnumTransaction.start:
                sqls.push(factory.createTransaction());
                break;
            case il_1.EnumTransaction.commit:
                sqls.push(factory.createCommit());
                break;
        }
    }
}
exports.BTransactionStatement = BTransactionStatement;
//# sourceMappingURL=transaction.js.map