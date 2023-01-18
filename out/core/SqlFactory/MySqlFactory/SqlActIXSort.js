"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActIXSort = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlActIXSort extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { IX } = p;
        let ret = Object.assign({}, p);
        ret.IX = this.getTableSchema(IX, ['ix']);
        return ret;
    }
    build() {
        let { IX, ix, xi: id, after } = this.param;
        let { name, schema } = IX;
        let { hasSort } = schema;
        if (hasSort === true) {
            let sql = `set @ret=\`${this.dbName}\`.${this.twProfix}${name}$sort(${ix},${id},${after})` + MySqlBuilder_1.sqlLineEnd;
            this.sql = sql + 'select @ret as ret' + MySqlBuilder_1.sqlLineEnd;
        }
        else {
            this.sql = 'select 0 as ret' + MySqlBuilder_1.sqlLineEnd;
        }
    }
}
exports.SqlActIXSort = SqlActIXSort;
//# sourceMappingURL=SqlActIXSort.js.map