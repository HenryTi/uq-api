"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDDetail = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDDetail extends MySqlBuilder_1.MySqlBuilder {
    constructor(factory, param) {
        super(factory);
        this.param = this.convertParam(param);
    }
    build() {
        let { id, main, detail, detail2, detail3 } = this.param;
        let sql = this.buildDetailSelect(main, '`id`=' + id);
        let whereMain = '`main`=' + id;
        sql += this.buildDetailSelect(detail, whereMain);
        sql += this.buildDetailSelect(detail2, whereMain);
        sql += this.buildDetailSelect(detail3, whereMain);
        return sql;
    }
}
exports.SqlIDDetail = SqlIDDetail;
//# sourceMappingURL=SqlIDDetail.js.map