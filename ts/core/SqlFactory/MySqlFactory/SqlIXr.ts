import { ParamIX } from "../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlIXr extends MySqlBuilder<ParamIX> {
    protected override convertParam(p: ParamIX): ParamIX {
        let { IX, IX1, IDX } = p;
        let param = Object.assign({}, p);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.IX1 = this.getTableSchema((IX1 as unknown) as string, ['ix']);
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return param;
    }

    build(): string {
        let { IX, ix, IDX, page } = this.param;
        let { cols, tables } = this.buildIXrIDX(IX, IDX);
        let where = '';
        if (ix) {
            if (Array.isArray(ix) === true) {
                if ((ix as []).length > 0) {
                    where = ' AND t0.xi in (' + (ix as []).join(',') + ')'
                }
            }
            else {
                where = ' AND t0.xi=' + ix;
            }
        }
        if (page) {
            let { start } = page;
            if (!start) start = 0;
            where += ' AND t0.ix>' + start;
        }
        let sql = `SELECT distinct ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ' ORDER BY t0.ix ASC';
        if (page) sql += ' LIMIT ' + page.size;
        sql += sqlLineEnd;
        return sql;
    }
}
