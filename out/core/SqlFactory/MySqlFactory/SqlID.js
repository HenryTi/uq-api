"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIdTypes = exports.SqlID = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlID extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { /*id, */ IDX } = p;
        let ret = Object.assign({}, p);
        let types = ['id', 'idx'];
        let IDTypes = IDX;
        /*
        let IDTypes: string | (string[]);
        IDTypes = IDX as unknown as any;
        let idTypes: string[];
        if (IDTypes === undefined) {
            let retIdTypes = await this.dbCaller.idTypes(unit, user, id);
            let coll: { [id: number]: string } = {};
            for (let r of retIdTypes) {
                let { id, $type } = r;
                coll[id] = $type;
            }
            if (typeof (id) === 'number') {
                IDTypes = coll[id];
                idTypes = [IDTypes];
            }
            else {
                IDTypes = idTypes = [];
                for (let v of id as number[]) {
                    idTypes.push(coll[v]);
                }
            }
        }
        ret.IDX = this.getTableSchemaArray(IDTypes, types);
        */
        ret.IDX = this.getTableSchemaArray(IDTypes, types);
        return ret;
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
class SqlIdTypes extends MySqlBuilder_1.MySqlBuilder {
    /*
    constructor(factory: SqlFactory, id: number | (number[])) {
        super(factory);
        if (Array.isArray(id) === false) {
            this.id = [id as number];
        }
        else {
            this.id = id as number[];
        }
    }
    */
    convertParam(param) {
        if (Array.isArray(param) === false) {
            this.id = [param];
        }
        else {
            this.id = param;
        }
        return;
    }
    build() {
        let sql = `SELECT a.id, b.name as $type FROM ${this.twProfix}$id_u as a JOIN ${this.twProfix}$entity as b ON a.entity=b.id WHERE a.id IN (${this.id.join(',')});`;
        return sql;
    }
}
exports.SqlIdTypes = SqlIdTypes;
//# sourceMappingURL=SqlID.js.map