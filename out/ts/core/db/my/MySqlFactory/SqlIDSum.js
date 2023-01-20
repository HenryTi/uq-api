"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDSum = exports.SqlSum = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlSum extends MySqlBuilder_1.MySqlBuilder {
    checkIDXSumField(p) {
        let param = Object.assign({}, p);
        let { IDX, field } = p;
        let ts = this.getTableSchema(IDX, ['idx']);
        param.IDX = ts;
        for (let f of field) {
            let fLower = f.toLowerCase();
            if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
                this.throwErr(`ID ${IDX} has no Field ${f}`);
            }
        }
        return param;
    }
}
exports.SqlSum = SqlSum;
class SqlIDSum extends SqlSum {
    convertParam(p) {
        return this.checkIDXSumField(p);
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
        this.sql = sql;
    }
}
exports.SqlIDSum = SqlIDSum;
//# sourceMappingURL=SqlIDSum.js.map