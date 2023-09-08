"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSleepStatement = void 0;
const bstatement_1 = require("./bstatement");
const sql_1 = require("../sql");
class BSleepStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { value } = this.istatement;
        let { factory } = this.context;
        let sleep = factory.createSleep();
        sqls.push(sleep);
        let val;
        if (value) {
            val = (0, sql_1.convertExp)(this.context, value);
        }
        else {
            val = sql_1.ExpNum.num0;
        }
        sleep.value = val;
    }
}
exports.BSleepStatement = BSleepStatement;
//# sourceMappingURL=sleep.js.map