"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BWhileStatement = void 0;
const bstatement_1 = require("./bstatement");
const sqls_1 = require("./sqls");
const sql_1 = require("../sql");
class BWhileStatement extends bstatement_1.BStatement {
    head(sqls) {
        sqls.head(this.istatement.statements.statements);
    }
    foot(sqls) {
        sqls.foot(this.istatement.statements.statements);
    }
    body(sqls) {
        let { factory } = this.context;
        let whileLoop = factory.createWhile();
        whileLoop.no = this.istatement.no;
        whileLoop.cmp = (0, sql_1.convertExp)(this.context, this.istatement.condition);
        let loopSqls = new sqls_1.Sqls(sqls.context, whileLoop.statements.statements);
        loopSqls.body(this.istatement.statements.statements);
        sqls.push(whileLoop);
    }
}
exports.BWhileStatement = BWhileStatement;
//# sourceMappingURL=while.js.map