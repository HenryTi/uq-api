import { ParamID } from "../../IDDefines";
import { MySqlBuilder } from "./MySqlBuilder";

export class SqlID extends MySqlBuilder<ParamID> {
    protected convertParam(p: ParamID): ParamID {
        let { IDX } = p;
        let ret = Object.assign({}, p);
        let types = ['id', 'idx'];
        let IDTypes: string | (string[]) = IDX as unknown as any;
        ret.IDX = this.getTableSchemaArray(IDTypes, types);
        return ret;
    }

    override build(): void {
        try {
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
            let IDX0 = IDX[0];
            if (IDX0 !== undefined) {
                cols += `, '${IDX0.name}' as $entity`;
            }
            let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} `;
            if (order) sql += ` ORDER BY t0.id ${this.buildOrder(order)}`;
            sql += `${limit}`;
            this.sql = sql;
        }
        catch (err) {
            debugger;
            console.error(err);
        }
    }
}

export class SqlIdTypes extends MySqlBuilder<number | (number[])> {
    private id: number[];

    protected convertParam(param: number | number[]): number | number[] {
        if (Array.isArray(param) === false) {
            this.id = [param as number];
        }
        else {
            this.id = param as number[];
        }
        return;
    }

    build(): void {
        let sql = `SELECT a.id, b.name as $type FROM ${this.twProfix}$id_u as a JOIN ${this.twProfix}$entity as b ON a.entity=b.id WHERE a.id IN (${this.id.join(',')});`;
        this.sql = sql;
    }
}
