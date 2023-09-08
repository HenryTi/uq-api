"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTableStatement = void 0;
const bstatement_1 = require("./bstatement");
class BTableStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { noDrop, table } = this.istatement;
        let { name, fields, keys } = table;
        let factory = this.context.factory;
        let tbl = factory.createVarTable();
        sqls.push(tbl);
        tbl.name = name;
        tbl.fields = fields;
        tbl.keys = keys;
        tbl.noDrop = noDrop;
    }
}
exports.BTableStatement = BTableStatement;
//# sourceMappingURL=table.js.map