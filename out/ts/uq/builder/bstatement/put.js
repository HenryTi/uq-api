"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BPutStatement = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("./bstatement");
class BPutStatement extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        let { putName, val } = this.istatement;
        putName = putName ?? '$';
        const varName = '$ret$' + putName;
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(varName, new il_1.Char(200));
        declare.put(putName);
        const set = factory.createSet();
        sqls.push(set);
        set.equ(varName, this.context.expVal(val));
    }
}
exports.BPutStatement = BPutStatement;
//# sourceMappingURL=put.js.map