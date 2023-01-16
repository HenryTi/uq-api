import { ParamID } from "../../dbCaller";
import { Builder } from "../Builder";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlID extends MySqlBuilder {
    private param: ParamID;

    constructor(builder: Builder, param: ParamID) {
        super(builder);
        this.param = param;
    }

    build(): string {
        let { IDX, id, page, order } = this.param;
        let { cols, tables } = this.buildIDX(IDX);
        let where: string = '';
        let limit: string = '';
        if (id !== undefined) {
            where = 't0.id' + (typeof id === 'number' ?
                '=' + id
                :
                ` in (${(id.join(','))})`);
        }
        else {
            where = '1=1'
        }
        if (page !== undefined) {
            let { start, size } = page;
            if (!start) start = 0;
            where += ` AND t0.id>${start}`;
            limit = ` limit ${size}`;
        }
        else {
            limit = ' limit 1000';
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} `;
        if (order) sql += ` ORDER BY t0.id ${this.buildOrder(order)}`;
        sql += `${limit}`;
        return sql;
    }
}

export class SqlIdTypes extends MySqlBuilder {
    private id: number[];
    constructor(builder: Builder, id: number | (number[])) {
        super(builder);
        if (Array.isArray(id) === false) {
            this.id = [id as number];
        }
        else {
            this.id = id as number[];
        }
    }

    build(): string {
        let sql = `SELECT a.id, b.name as $type FROM ${this.twProfix}$id_u as a JOIN ${this.twProfix}$entity as b ON a.entity=b.id WHERE a.id IN (${this.id.join(',')});`;
        return sql;
    }
}
