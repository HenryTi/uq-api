"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDDetail = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDDetail extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { main, detail, detail2, detail3 } = p;
        let ret = Object.assign({}, p);
        let types = ['id'];
        ret.main = this.getTableSchema(main, types);
        ret.detail = this.getTableSchema(detail, types);
        if (detail2) {
            ret.detail2 = this.getTableSchema(detail2, types);
        }
        if (detail3) {
            ret.detail3 = this.getTableSchema(detail3, types);
        }
        return ret;
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