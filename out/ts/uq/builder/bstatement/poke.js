"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BPokeStatement = void 0;
const bstatement_1 = require("./bstatement");
const sql_1 = require("../sql");
const dbContext_1 = require("../dbContext");
class BPokeStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { user } = this.istatement;
        let { factory } = this.context;
        let upsert = factory.createUpsert();
        sqls.push(upsert);
        let val = (0, sql_1.convertExp)(this.context, user);
        upsert.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.user);
        upsert.keys = [{
                col: 'id',
                val,
            }];
        upsert.cols = [{
                col: 'poke',
                val: sql_1.ExpNum.num1,
            }];
    }
}
exports.BPokeStatement = BPokeStatement;
//# sourceMappingURL=poke.js.map