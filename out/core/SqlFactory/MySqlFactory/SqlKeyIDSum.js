"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlKeyIDSum = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlKeyIDSum extends MySqlBuilder_1.MySqlBuilder {
    constructor(factory, param) {
        super(factory);
        this.param = this.convertParam(param);
    }
    build() {
        let { ID, key, page } = this.param;
        let sql = this.buildSumSelect(this.param);
        let { schema } = ID;
        let { keys } = schema;
        sql += ` RIGHT JOIN \`${this.twProfix}${ID.name}\` as t0 ON t0.id=t.id WHERE 1=1`;
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
        return sql;
    }
}
exports.SqlKeyIDSum = SqlKeyIDSum;
//# sourceMappingURL=SqlKeyIDSum.js.map