"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlKeyID = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlKeyID extends MySqlBuilder_1.MySqlBuilder {
    constructor(factory, param) {
        super(factory);
        this.param = this.convertParam(param);
    }
    build() {
        let { ID, IX, key, ix, IDX, page } = this.param;
        let arr = [];
        let tID, tIX;
        let where = '';
        if (this.hasUnit === true) {
            where += 't0.$unit=@unit';
        }
        if (ID) {
            tID = arr.length;
            arr.push(ID);
        }
        if (IX) {
            tIX = arr.length;
            arr.push(...IX);
            if (ix) {
                where += ` AND t${tIX}.ix=${ix}`;
            }
            else {
                where += ` AND t${tIX}.ix=@user`;
            }
        }
        if (IDX) {
            arr.push(...IDX);
        }
        let { cols, tables } = this.buildIDX(arr);
        let { schema } = ID;
        let { keys } = schema;
        for (let k of keys) {
            let v = key[k.name];
            if (v === undefined)
                continue;
            where += ` AND t${tID}.\`${k.name}\`='${v}'`;
        }
        if (page) {
            let { start, size } = page;
            if (!start)
                start = 0;
            where += ` AND t${tID}.id>${start}`;
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ` ORDER BY t${tID}.id ASC`;
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += MySqlBuilder_1.sqlLineEnd;
        return sql;
    }
}
exports.SqlKeyID = SqlKeyID;
//# sourceMappingURL=SqlKeyID.js.map