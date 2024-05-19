"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDinIX = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDinIX extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { IX, ID } = p;
        let param = Object.assign({}, p);
        param.IX = this.getTableSchema(IX, ['ix']);
        param.ID = this.getTableSchema(ID, ['id']);
        return param;
    }
    build() {
        let { IX, ID, ix, page } = this.param;
        let { cols, tables } = this.buildIDX([ID]);
        let where = '';
        let limit = '';
        where = '1=1';
        if (page !== undefined) {
            let { start, size } = page;
            if (!start)
                start = 0;
            where += ` AND t0.id>${start}`;
            limit = `limit ${size}`;
        }
        cols += `,case when exists(select id from \`${this.twProfix}${IX.name}\` where ix=${ix ?? '@user'} and id=t0.id) then 1 else 0 end as $in`;
        this.sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
    }
}
exports.SqlIDinIX = SqlIDinIX;
//# sourceMappingURL=SqlIDinIX.js.map