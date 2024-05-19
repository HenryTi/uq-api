"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIXValues = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIXValues extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { IX } = p;
        let param = Object.assign({}, p);
        param.IX = this.getTableSchema(IX, ['ix']);
        return param;
    }
    build() {
        let { IX, ix, page, order } = this.param;
        let xiType = IX.schema.xiType;
        let tStart, tSize;
        if (page) {
            let { start, size } = page;
            tStart = start ?? null;
            tSize = size ?? null;
        }
        if (!order)
            order = 'asc';
        this.sql = `call ${this.dbName}.${this.twProfix}$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
        this.buildCall();
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
        this.proc = proc;
        this.procParameters = callParams;
    }
}
exports.SqlIXValues = SqlIXValues;
//# sourceMappingURL=SqlIXValues.js.map