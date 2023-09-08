"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BDeleteStatement = void 0;
const bstatement_1 = require("./bstatement");
const select_1 = require("../sql/select");
class BDeleteStatement extends bstatement_1.BStatement {
    body(sqls) {
        sqls.push((0, select_1.convertDelete)(this.context, this.istatement.del));
        /*
        let {from, where, tableAlias} = this.istatement.del;
        let del = this.context.factory.createDelete();
        sqls.push(del);
        del.tables = [new EntityTable(from.name, from.type==='tuid'?!from.global:true, tableAlias)];
        del.where(convertExp(this.context, where) as ExpCmp);
        */
    }
}
exports.BDeleteStatement = BDeleteStatement;
//# sourceMappingURL=delete.js.map