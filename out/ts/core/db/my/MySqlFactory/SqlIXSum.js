"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIXSum = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
const SqlIDSum_1 = require("./SqlIDSum");
class SqlIXSum extends SqlIDSum_1.SqlSum {
    convertParam(p) {
        return this.checkIDXSumField(p);
    }
    build() {
        let { IX, ix, page } = this.param;
        let sql = this.buildSumSelect(this.param);
        sql += ` RIGHT JOIN \`${this.twProfix}${IX.name}\` as t0 ON t0.xi=t.id WHERE 1=1`;
        if (this.hasUnit === true) {
            sql += ' AND t0.$unit=@unit';
        }
        sql = ' AND t0.ix' + (Array.isArray(ix) ?
            ' in (' + ix.join(',') + ')'
            :
                '=' + ix);
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            sql += ' AND t0.xi>' + start;
        }
        sql += ' ORDER BY t0.xi ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += MySqlBuilder_1.sqlLineEnd;
        this.sql = sql;
    }
}
exports.SqlIXSum = SqlIXSum;
//# sourceMappingURL=SqlIXSum.js.map