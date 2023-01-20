import { ParamIDxID } from "../../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlIDxID extends MySqlBuilder<ParamIDxID> {
    protected override convertParam(p: ParamIDxID): ParamIDxID {
        let { ID, IX, ID2 } = p;
        let param = Object.assign({}, p);
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.ID2 = this.getTableSchema((ID2 as unknown) as string, ['id']);
        return param;
    }

    build(): string {
        let { ID, IX, ID2, page } = this.param;
        page = page ?? { start: 0, size: 100 };
        let { cols, tables } = this.buildIDX([ID]);
        let where: string = '';
        let limit: string = '';
        where = '1=1';
        let { start, size } = page;
        if (!start) start = 0;
        where += ` AND t0.id>${start}`;
        limit = `limit ${size}`;

        let { cols: cols2, tables: tables2 } = this.buildIDX([ID2]);

        let sql = '';
        sql += `DROP TEMPORARY TABLE IF EXISTS ids` + sqlLineEnd;
        sql += '\nCREATE TEMPORARY TABLE ids (id BIGINT, primary key (id))' + sqlLineEnd;
        sql += `\nINSERT INTO ids (id) SELECT t0.id FROM ${tables} WHERE ${where} ${limit}` + sqlLineEnd;
        sql += `\nSELECT ${cols} FROM ${tables} JOIN ids as z ON t0.id=z.id` + sqlLineEnd;
        sql += `\nSELECT x.id as \`$xid\`, ${cols2} FROM ${tables2} JOIN \`${this.twProfix}${IX.name}\` as x ON t0.id=x.id JOIN ids as z ON x.id=z.id` + sqlLineEnd;
        return sql;
    }
}
