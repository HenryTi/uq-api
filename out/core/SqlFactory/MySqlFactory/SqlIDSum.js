"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDSum = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDSum extends MySqlBuilder_1.MySqlBuilder {
    constructor(factory, param) {
        super(factory);
        this.param = this.convertParam(param);
    }
    build() {
        let { id } = this.param;
        let sql = this.buildSumSelect(this.param);
        if (id !== undefined) {
            sql += ' where t.id';
            if (Array.isArray(id) === true) {
                sql += ' in (' + id.join() + ')';
            }
            else {
                sql += `=${id}`;
            }
        }
        return sql;
    }
}
exports.SqlIDSum = SqlIDSum;
//# sourceMappingURL=SqlIDSum.js.map