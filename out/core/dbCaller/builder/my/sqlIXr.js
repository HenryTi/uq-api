"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIXr = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIXr extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, ix, IDX, page } = this.param;
        let { cols, tables } = this.buildIXrIDX(IX, IDX);
        let where = '';
        if (ix) {
            if (Array.isArray(ix) === true) {
                if (ix.length > 0) {
                    where = ' AND t0.xi in (' + ix.join(',') + ')';
                }
            }
            else {
                where = ' AND t0.xi=' + ix;
            }
        }
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            where += ' AND t0.ix>' + start;
        }
        let sql = `SELECT distinct ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ' ORDER BY t0.ix ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += mySqlBuilder_1.sqlEndStatement;
        return sql;
    }
}
exports.SqlIXr = SqlIXr;
//# sourceMappingURL=sqlIXr.js.map