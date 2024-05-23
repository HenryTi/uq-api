"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDNO = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDNO extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { ID } = p;
        let param = Object.assign({}, p);
        let types = ['id'];
        param.ID = this.getTableSchema(ID, types);
        return param;
    }
    build() {
        let { ID, stamp } = this.param;
        this.sql = `SELECT ${this.twProfix}$no(@unit, '${ID.name}', ${stamp !== null && stamp !== void 0 ? stamp : null}) as no` + MySqlBuilder_1.sqlLineEnd;
    }
}
exports.SqlIDNO = SqlIDNO;
//# sourceMappingURL=SqlIDNO.js.map