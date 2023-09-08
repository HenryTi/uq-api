"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFailStatement = void 0;
const bstatement_1 = require("./bstatement");
class BFailStatement extends bstatement_1.BStatement {
    body(sqls) {
        let factory = this.context.factory;
        let ret = factory.createLeaveProc();
        sqls.push(ret);
    }
}
exports.BFailStatement = BFailStatement;
//# sourceMappingURL=fail.js.map