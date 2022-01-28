"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActIXSort = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlActIXSort extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, ix, xi: id, after } = this.param;
        let { name, schema } = IX;
        let { hasSort } = schema;
        if (hasSort === true) {
            let sql = `set @ret=\`${this.dbName}\`.tv_${name}$sort(${ix},${id},${after})` + mySqlBuilder_1.sqlEndStatement;
            return sql + 'select @ret as ret' + mySqlBuilder_1.sqlEndStatement;
        }
        else {
            return 'select 0 as ret' + mySqlBuilder_1.sqlEndStatement;
        }
    }
}
exports.SqlActIXSort = SqlActIXSort;
//# sourceMappingURL=sqlActIXSort.js.map