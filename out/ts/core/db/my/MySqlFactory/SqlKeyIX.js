"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlKeyIX = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlKeyIX extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { ID, IX, IDX } = p;
        let param = Object.assign({}, p);
        param.ID = this.getTableSchema(ID, ['id']);
        param.IX = this.getTableSchema(IX, ['ix']);
        param.IDX = this.getTableSchemaArray(IDX, ['id', 'idx']);
        return param;
    }
    build() {
        let { ID, IX, key, IDX, page } = this.param;
        let arr = [IX];
        if (IDX)
            arr.push(...IDX);
        let { cols, tables } = this.buildIDX(arr);
        let { name, schema } = ID;
        let { keys } = schema;
        let joinID = ' JOIN `' + this.twProfix + name + '` as t ON t.id=t0.id';
        let where = '';
        if (this.hasUnit === true) {
            where += 't.$unit=@unit';
        }
        for (let k of keys) {
            let v = key[k.name];
            if (v === undefined)
                continue;
            where += ' AND t.`' + k.name + '`=\'' + v + '\'';
        }
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            where += ' AND t0.id>' + start;
        }
        let sql = `SELECT ${cols} FROM ${tables}${joinID} WHERE 1=1${where}`;
        sql += ' ORDER BY t0.id ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += MySqlBuilder_1.sqlLineEnd;
        this.sql = sql;
    }
}
exports.SqlKeyIX = SqlKeyIX;
//# sourceMappingURL=SqlKeyIX.js.map