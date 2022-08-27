"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIdTypes = exports.SqlID = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlID extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IDX, id, page, order } = this.param;
        let { cols, tables } = this.buildIDX(IDX);
        let where = '';
        let limit = '';
        if (id !== undefined) {
            where = 't0.id' + (typeof id === 'number' ?
                '=' + id
                :
                    ` in (${(id.join(','))})`);
        }
        else {
            where = '1=1';
        }
        if (page !== undefined) {
            let { start, size } = page;
            if (!start)
                start = 0;
            where += ` AND t0.id>${start}`;
            limit = ` limit ${size}`;
        }
        else {
            limit = ' limit 1000';
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} `;
        if (order)
            sql += ` ORDER BY t0.id ${this.buildOrder(order)}`;
        sql += `${limit}`;
        return sql;
    }
}
exports.SqlID = SqlID;
class SqlIdTypes extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, id) {
        super(builder);
        if (Array.isArray(id) === false) {
            this.id = [id];
        }
        else {
            this.id = id;
        }
    }
    build() {
        let sql = `SELECT a.id, b.name as $type FROM tv_$id_u as a JOIN tv_$entity as b ON a.entity=b.id WHERE a.id IN (${this.id.join(',')});`;
        return sql;
    }
}
exports.SqlIdTypes = SqlIdTypes;
//# sourceMappingURL=sqlID.js.map