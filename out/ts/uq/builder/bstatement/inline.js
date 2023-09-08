"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BInlineStatement = void 0;
const bstatement_1 = require("./bstatement");
class BInlineStatement extends bstatement_1.BStatement {
    body(sqls) {
        let factory = this.context.factory;
        let inline = factory.createInline();
        inline.dbType = this.istatement.dbType;
        inline.code = this.istatement.code;
        inline.memo = this.istatement.memo;
        sqls.push(inline);
    }
}
exports.BInlineStatement = BInlineStatement;
//# sourceMappingURL=inline.js.map