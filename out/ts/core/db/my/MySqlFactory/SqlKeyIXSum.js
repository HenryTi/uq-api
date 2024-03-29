"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlKeyIXSum = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
const SqlIDSum_1 = require("./SqlIDSum");
class SqlKeyIXSum extends SqlIDSum_1.SqlSum {
    convertParam(p) {
        return this.checkIDXSumField(p);
    }
    build() {
        let { ID, IX, key, IDX, page } = this.param;
        let sql = this.buildSumSelect(this.param);
        let { schema } = ID;
        let { keys } = schema;
        sql += ` RIGHT JOIN \`${this.twProfix}${ID.name}\` as t0 ON t0.id=t.id`;
        sql += ` RIGHT JOIN \`${this.twProfix}${IX.name}\` as t1 ON t0.id=t1.xi`;
        if (this.hasUnit === true) {
            sql += ' AND t0.$unit=t1.$unit';
        }
        sql += ` WHERE 1=1`;
        if (this.hasUnit === true) {
            sql += ' AND t0.$unit=@unit';
        }
        for (let k of keys) {
            let v = key[k.name];
            if (v === undefined)
                break;
            sql += ' AND t0.`' + k.name + '`=\'' + v + '\'';
        }
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            sql += ' AND t0.id>' + start;
        }
        sql += ' ORDER BY t0.id ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += MySqlBuilder_1.sqlLineEnd;
        this.sql = sql;
    }
}
exports.SqlKeyIXSum = SqlKeyIXSum;
//# sourceMappingURL=SqlKeyIXSum.js.map