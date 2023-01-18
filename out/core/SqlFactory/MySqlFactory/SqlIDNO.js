"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDNO = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDNO extends MySqlBuilder_1.MySqlBuilder {
    constructor(factory, param) {
        super(factory);
        this.param = this.convertParam(param);
    }
    build() {
        let { ID, stamp } = this.param;
        let sql = `SELECT ${this.twProfix}$no(@unit, '${ID.name}', ${stamp !== null && stamp !== void 0 ? stamp : null}) as no` + MySqlBuilder_1.sqlLineEnd;
        return sql;
    }
}
exports.SqlIDNO = SqlIDNO;
//# sourceMappingURL=SqlIDNO.js.map