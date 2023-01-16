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
            tStart = start !== null && start !== void 0 ? start : null;
            tSize = size !== null && size !== void 0 ? size : null;
        }
        if (!order)
            order = 'asc';
        let sql = `call ${this.dbName}.${this.twProfix}$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
        return sql;
    }
    buildCall() {
        let proc = `${this.twProfix}$ix_values`;
        let { IX, ix, page, order } = this.param;
        let xiType = IX.schema.xiType;
        let tStart, tSize;
        if (page) {
            let { start, size } = page;
            tStart = start;
            tSize = size;
        }
        if (!order)
            order = 'asc';
        let callParams = [
            IX.name, xiType, ix, tStart, tSize, order
        ];
        //let sql = `call ${this.dbName}.${this.twProfix}$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
        return { proc, params: callParams };
    }
}
exports.SqlIXValues = SqlIXValues;
//# sourceMappingURL=sqlIXValues.js.map