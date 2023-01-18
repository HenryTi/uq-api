"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIXr = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIXr extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { IX, IX1, IDX } = p;
        let param = Object.assign({}, p);
        param.IX = this.getTableSchema(IX, ['ix']);
        param.IX1 = this.getTableSchema(IX1, ['ix']);
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX, types);
        return param;
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
        sql += MySqlBuilder_1.sqlLineEnd;
        return sql;
    }
}
exports.SqlIXr = SqlIXr;
//# sourceMappingURL=SqlIXr.js.map