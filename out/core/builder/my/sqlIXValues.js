"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIXValues = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIXValues extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, ix, page, order } = this.param;
        let xiType = IX.schema.xiType;
        let tStart, tSize;
        if (page) {
            let { start, size } = page;
            if (!start)
                tStart = 'NULL';
            else
                tStart = String(start);
            if (!size)
                tSize = 'NULL';
            else
                tSize = String(size);
        }
        let sql = `call ${this.dbName}.tv_$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
        return sql;
    }
}
exports.SqlIXValues = SqlIXValues;
//# sourceMappingURL=sqlIXValues.js.map