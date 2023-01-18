import { ParamIDinIX } from "../IDDefines";
import { MySqlBuilder } from "./MySqlBuilder";

export class SqlIDinIX extends MySqlBuilder<ParamIDinIX> {
    protected override convertParam(p: ParamIDinIX): ParamIDinIX {
        let { IX, ID } = p;
        let param = Object.assign({}, p);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        return param;
    }

    build(): string {
        let { IX, ID, ix, page } = this.param;
        let { cols, tables } = this.buildIDX([ID]);
        let where: string = '';
        let limit: string = '';
        where = '1=1';
        if (page !== undefined) {
            let { start, size } = page;
            if (!start) start = 0;
            where += ` AND t0.id>${start}`;
            limit = `limit ${size}`;
        }
        cols += `,case when exists(select id from \`${this.twProfix}${IX.name}\` where ix=${ix ?? '@user'} and id=t0.id) then 1 else 0 end as $in`;

        let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
        return sql;
    }
}
